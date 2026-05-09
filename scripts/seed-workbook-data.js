const { config } = require('dotenv');
config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const INTERNAL_WORKERS_TO_ADD = 10;
const EXTERNAL_CONTRACTORS_TO_ADD = 10;
const CUSTOMERS_TO_ADD = 10;
const JOB_SITES_TO_ADD = 50;
const WEEKS_TO_SCHEDULE = 6;
const JOBS_PER_WEEKDAY = 5;
const WORKBOOK_DEFAULT_PASSWORD = 'WorkbookTest!2026';

const BASE_LAT = 52.78509;
const BASE_LNG = -1.615;
const MAX_RADIUS_KM = 7;

const WORKER_ROLES = ['Technician', 'Senior Technician', 'Supervisor', 'Specialist Cleaner'];
const WORKER_SKILLS = [
  ['Cleaner / handy person'],
  ['Deep cleaning', 'Sanitation'],
  ['Office cleaning', 'Waste handling'],
  ['Floor care', 'Polishing'],
  ['Access control', 'Security checks'],
  ['Washroom hygiene', 'Consumables refill'],
  ['Maintenance support', 'Minor repairs'],
];
const CONTRACTOR_SPECIALTIES = [
  ['urgent_callout', 'spill_response'],
  ['deep_clean', 'office_cleaning'],
  ['retail_close_clean', 'weekend_cover'],
  ['hard_floor_restoration', 'floor_polish'],
  ['maintenance', 'minor_repairs'],
  ['window_cleaning', 'facade_clean'],
];
const CONTRACT_TYPES = ['cleaning', 'maintenance', 'specialist'];
const BILLING_FREQUENCIES = ['monthly', 'quarterly', 'one_off'];
const SITE_TYPES = ['Office', 'Retail', 'Industrial', 'Education', 'Healthcare'];

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick(arr) {
  return arr[randInt(0, arr.length - 1)];
}

function asItems(items) {
  return items.map((text, idx) => ({
    id: `item-${idx + 1}`,
    text,
    description: '',
    imageUrl: '',
    isCompleted: false,
  }));
}

function toIsoLocal(date) {
  return new Date(date).toISOString();
}

function startOfNextMonday() {
  const now = new Date();
  const day = now.getDay();
  const daysUntilMonday = ((8 - day) % 7) || 7;
  const nextMonday = new Date(now);
  nextMonday.setDate(now.getDate() + daysUntilMonday);
  nextMonday.setHours(6, 0, 0, 0);
  return nextMonday;
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function addMinutes(date, mins) {
  const d = new Date(date);
  d.setMinutes(d.getMinutes() + mins);
  return d;
}

function randomNearbyPoint(baseLat, baseLng, maxRadiusKm) {
  const radiusKm = Math.random() * maxRadiusKm;
  const angle = Math.random() * Math.PI * 2;
  const dLat = (radiusKm / 111) * Math.cos(angle);
  const dLng = (radiusKm / (111 * Math.cos((baseLat * Math.PI) / 180))) * Math.sin(angle);
  return { lat: baseLat + dLat, lng: baseLng + dLng };
}

async function reverseGeocodeMapbox(token, lat, lng) {
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?types=address&limit=1&language=en&access_token=${token}`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) {
    throw new Error(`Mapbox reverse geocode failed: ${res.status}`);
  }
  const body = await res.json();
  const feature = body?.features?.[0];
  if (!feature) return null;

  const ctx = feature.context || [];
  const city =
    ctx.find((c) => c.id?.startsWith('place'))?.text ||
    ctx.find((c) => c.id?.startsWith('locality'))?.text ||
    feature.text ||
    'Burton on Trent';
  const postcode = ctx.find((c) => c.id?.startsWith('postcode'))?.text || 'DE15 9SE';
  const country = ctx.find((c) => c.id?.startsWith('country'))?.short_code?.toUpperCase() || 'GB';
  const region = ctx.find((c) => c.id?.startsWith('region'))?.text || 'Staffordshire';

  const addressLine = feature.address
    ? `${feature.address} ${feature.text}`
    : feature.place_name.split(',')[0];

  return {
    address: addressLine,
    city,
    state: region,
    postal_code: postcode,
    country,
    latitude: feature.center?.[1] ?? lat,
    longitude: feature.center?.[0] ?? lng,
  };
}

async function collectJobSiteAddresses(token, needed) {
  const found = [];
  const seen = new Set();
  let attempts = 0;
  const maxAttempts = needed * 20;

  while (found.length < needed && attempts < maxAttempts) {
    attempts += 1;
    try {
      const point = randomNearbyPoint(BASE_LAT, BASE_LNG, MAX_RADIUS_KM);
      const geo = await reverseGeocodeMapbox(token, point.lat, point.lng);
      if (!geo) continue;
      const key = `${geo.address}|${geo.postal_code}`;
      if (seen.has(key)) continue;
      seen.add(key);
      found.push(geo);
    } catch (err) {
      // Keep trying until max attempts.
    }
  }

  if (found.length < needed) {
    throw new Error(`Only found ${found.length}/${needed} unique addresses from reverse geocoding.`);
  }

  return found;
}

function createChecklistTemplates() {
  return [
    {
      name: 'Pre-Arrival Safety Sweep',
      description: 'Before entry checks and safe-start controls.',
      items: asItems(['PPE check', 'Hazard scan', 'Access confirmed', 'Sign-in completed']),
    },
    {
      name: 'Office Clean Core',
      description: 'Core repeatable tasks for office sites.',
      items: asItems(['Desks and touchpoints sanitized', 'Bins emptied', 'Kitchen reset', 'Washrooms restocked']),
    },
    {
      name: 'Retail End-of-Day',
      description: 'Close-down clean for retail units.',
      items: asItems(['Shopfloor vacuum', 'Till area clean', 'Front glass wipe', 'Waste removed']),
    },
    {
      name: 'Industrial Deep Clean',
      description: 'Extended checklist for industrial environments.',
      items: asItems(['Machinery surrounds cleaned', 'Walkways degreased', 'Signage visible', 'Waste segregated']),
    },
    {
      name: 'Client Handover',
      description: 'Final checks before completion.',
      items: asItems(['Before photos captured', 'After photos captured', 'Notes added', 'Client confirmation recorded']),
    },
  ];
}

async function getOrCreateTargetTenant(supabase, slugHint) {
  if (slugHint) {
    const { data, error } = await supabase
      .from('tenants')
      .select('id,name,slug')
      .eq('slug', slugHint)
      .single();
    if (error) throw error;
    return data;
  }

  const { data, error } = await supabase
    .from('tenants')
    .select('id,name,slug,created_at')
    .ilike('slug', 'pw-smoke-company-%')
    .order('created_at', { ascending: false })
    .limit(1);

  if (error) throw error;
  if (data?.length) return data[0];

  const { data: fallback, error: fallbackError } = await supabase
    .from('tenants')
    .select('id,name,slug,created_at')
    .order('created_at', { ascending: false })
    .limit(1);
  if (fallbackError) throw fallbackError;
  if (!fallback?.length) throw new Error('No tenant found.');
  return fallback[0];
}

async function createInternalWorkers(supabase, tenantId, batchTag) {
  const createdWorkerIds = [];
  const credentials = [];
  for (let i = 1; i <= INTERNAL_WORKERS_TO_ADD; i += 1) {
    const workerNum = String(i).padStart(2, '0');
    const firstName = `WB${workerNum}`;
    const lastName = `Internal ${batchTag}`;
    const email = `wb-internal-${batchTag}-${workerNum}@example.com`;
    const password = WORKBOOK_DEFAULT_PASSWORD;

    let userId = null;
    const existing = await supabase.from('users').select('id').eq('email', email).maybeSingle();
    if (existing.data?.id) {
      userId = existing.data.id;
      const updatePassword = await supabase.auth.admin.updateUserById(userId, { password });
      if (updatePassword.error) {
        throw new Error(`Failed updating password for ${email}: ${updatePassword.error.message}`);
      }
    } else {
      const authCreate = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        app_metadata: { tenant_id: tenantId, role: 'worker' },
        user_metadata: { first_name: firstName, last_name: lastName },
      });

      if (authCreate.error) {
        throw new Error(`Failed creating auth user ${email}: ${authCreate.error.message}`);
      }

      userId = authCreate.data.user.id;

      const publicInsert = await supabase.from('users').insert({
        id: userId,
        tenant_id: tenantId,
        email,
        first_name: firstName,
        last_name: lastName,
        role: 'worker',
      });
      if (publicInsert.error) {
        throw new Error(`Failed inserting public user ${email}: ${publicInsert.error.message}`);
      }
    }

    const existingWorker = await supabase
      .from('workers')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('email', email)
      .maybeSingle();

    if (existingWorker.data?.id) {
      createdWorkerIds.push(existingWorker.data.id);
      credentials.push({ email, password, role: 'worker', source: 'workbook-seed' });
      continue;
    }

    const workerInsert = await supabase
      .from('workers')
      .insert({
        tenant_id: tenantId,
        user_id: userId,
        first_name: firstName,
        last_name: lastName,
        email,
        phone: `+44 7700 ${randInt(100000, 999999)}`,
        role: pick(WORKER_ROLES),
        skills: pick(WORKER_SKILLS),
        hourly_rate: randInt(13, 22),
        status: 'active',
        area_postcode: 'DE15 9SE',
        area_radius: randInt(8, 25),
        has_own_transport: Math.random() > 0.3,
      })
      .select('id')
      .single();

    if (workerInsert.error) {
      throw new Error(`Failed creating worker ${email}: ${workerInsert.error.message}`);
    }
    createdWorkerIds.push(workerInsert.data.id);
    credentials.push({ email, password, role: 'worker', source: 'workbook-seed' });
  }
  return { createdWorkerIds, credentials };
}

async function createExternalContractors(supabase, tenantId, batchTag) {
  const created = [];
  const credentials = [];
  for (let i = 1; i <= EXTERNAL_CONTRACTORS_TO_ADD; i += 1) {
    const num = String(i).padStart(2, '0');
    const firstName = `WBExt${num}`;
    const lastName = `Partner ${batchTag}`;
    const email = `wb-external-${batchTag}-${num}@example.com`;

    let providerUserId = null;
    const existingUser = await supabase.from('users').select('id').eq('email', email).maybeSingle();
    if (existingUser.data?.id) {
      providerUserId = existingUser.data.id;
      const updatePassword = await supabase.auth.admin.updateUserById(providerUserId, {
        password: WORKBOOK_DEFAULT_PASSWORD,
      });
      if (updatePassword.error) {
        throw new Error(`Failed updating password for ${email}: ${updatePassword.error.message}`);
      }
    } else {
      const authCreate = await supabase.auth.admin.createUser({
        email,
        password: WORKBOOK_DEFAULT_PASSWORD,
        email_confirm: true,
        app_metadata: { tenant_id: tenantId, role: 'provider' },
        user_metadata: { first_name: firstName, last_name: lastName },
      });
      if (authCreate.error) {
        throw new Error(`Failed creating provider auth user ${email}: ${authCreate.error.message}`);
      }

      providerUserId = authCreate.data.user.id;
      const pubInsert = await supabase.from('users').insert({
        id: providerUserId,
        tenant_id: tenantId,
        email,
        first_name: firstName,
        last_name: lastName,
        role: 'provider',
      });
      if (pubInsert.error) {
        throw new Error(`Failed creating provider public user ${email}: ${pubInsert.error.message}`);
      }
    }

    const existingContractor = await supabase
      .from('contractors')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('email', email)
      .maybeSingle();

    if (existingContractor.data?.id) {
      created.push(existingContractor.data.id);
      credentials.push({
        email,
        password: WORKBOOK_DEFAULT_PASSWORD,
        role: 'provider',
        source: 'workbook-seed',
      });
      continue;
    }

    const contractorInsert = await supabase
      .from('contractors')
      .insert({
        tenant_id: tenantId,
        user_id: providerUserId,
        company_name: `WB External Services ${num}`,
        contact_name: `${firstName} ${lastName}`,
        email,
        phone: `+44 7800 ${randInt(100000, 999999)}`,
        specialties: pick(CONTRACTOR_SPECIALTIES),
        status: 'active',
        area_postcode: 'DE15 9SE',
        area_radius: randInt(10, 30),
        has_own_transport: true,
      })
      .select('id')
      .single();

    if (contractorInsert.error) {
      throw new Error(`Failed creating contractor ${email}: ${contractorInsert.error.message}`);
    }

    created.push(contractorInsert.data.id);
    credentials.push({
      email,
      password: WORKBOOK_DEFAULT_PASSWORD,
      role: 'provider',
      source: 'workbook-seed',
    });
  }

  return { contractorIds: created, credentials };
}

async function createCustomers(supabase, tenantId, batchTag) {
  const created = [];
  for (let i = 1; i <= CUSTOMERS_TO_ADD; i += 1) {
    const num = String(i).padStart(2, '0');
    const email = `wb-customer-${batchTag}-${num}@example.com`;
    const existing = await supabase
      .from('customers')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('email', email)
      .maybeSingle();

    if (existing.data?.id) {
      created.push(existing.data.id);
      continue;
    }

    const type = i % 3 === 0 ? 'individual' : 'business';
    const insert = await supabase
      .from('customers')
      .insert({
        tenant_id: tenantId,
        business_name: type === 'business' ? `Workbook Customer ${num}` : null,
        contact_name: `Workbook Contact ${num}`,
        email,
        phone: `+44 7900 ${randInt(100000, 999999)}`,
        address: `${randInt(1, 350)} Main Street`,
        city: 'Burton on Trent',
        state: 'Staffordshire',
        postal_code: 'DE15 9SE',
        country: 'GB',
        type,
        payment_terms: i % 2 ? '14 days' : '30 days',
        engagement_type: i % 4 === 0 ? 'contract' : 'pay_as_you_go',
        is_active: true,
      })
      .select('id')
      .single();

    if (insert.error) {
      throw new Error(`Failed creating customer ${email}: ${insert.error.message}`);
    }
    created.push(insert.data.id);
  }

  return created;
}

async function ensureChecklistTemplates(supabase, tenantId) {
  const { data: existing, error } = await supabase
    .from('checklists')
    .select('id,name,items,is_template')
    .eq('tenant_id', tenantId)
    .eq('is_template', true)
    .order('created_at', { ascending: true });

  if (error) throw error;
  const templates = [...(existing || [])];

  if (templates.length >= 6) return templates;

  const toCreate = createChecklistTemplates();
  for (const template of toCreate) {
    const hasSameName = templates.some((t) => t.name === template.name);
    if (hasSameName) continue;

    const ins = await supabase
      .from('checklists')
      .insert({
        tenant_id: tenantId,
        name: template.name,
        description: template.description,
        items: template.items,
        is_template: true,
      })
      .select('id,name,items,is_template')
      .single();

    if (ins.error) {
      throw new Error(`Failed creating checklist template ${template.name}: ${ins.error.message}`);
    }
    templates.push(ins.data);
  }

  return templates;
}

async function createJobSites(supabase, tenantId, customerIds, addresses, batchTag) {
  const created = [];
  for (let i = 0; i < JOB_SITES_TO_ADD; i += 1) {
    const addr = addresses[i];
    const customerId = customerIds[i % customerIds.length];
    const siteNum = String(i + 1).padStart(2, '0');
    const siteName = `WB ${batchTag} Site ${siteNum}`;

    const existing = await supabase
      .from('job_sites')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('name', siteName)
      .maybeSingle();
    if (existing.data?.id) {
      created.push({ id: existing.data.id, customer_id: customerId });
      continue;
    }

    const insert = await supabase
      .from('job_sites')
      .insert({
        tenant_id: tenantId,
        customer_id: customerId,
        name: siteName,
        address: addr.address,
        city: addr.city || 'Burton on Trent',
        state: addr.state || 'Staffordshire',
        postal_code: addr.postal_code || 'DE15 9SE',
        country: addr.country || 'GB',
        latitude: addr.latitude,
        longitude: addr.longitude,
        what3words: null,
        access_instructions: 'Call site contact before arrival. Use signed visitor entrance.',
        security_codes: '',
        key_holder: 'Site manager',
        facilities: 'Washroom, storage, electrical panel access',
        site_type: pick(SITE_TYPES),
        parking_info: 'Visitor parking near reception or signed service bay.',
        is_active: true,
      })
      .select('id,customer_id')
      .single();

    if (insert.error) {
      throw new Error(`Failed creating site ${siteName}: ${insert.error.message}`);
    }
    created.push(insert.data);
  }

  return created;
}

async function createContracts(supabase, tenantId, customerIds, jobSites, batchTag) {
  const contractIds = [];
  for (let i = 0; i < customerIds.length; i += 1) {
    const customerId = customerIds[i];
    const countForCustomer = randInt(1, 3);
    const customerSites = jobSites.filter((s) => s.customer_id === customerId);
    if (!customerSites.length) continue;

    for (let j = 0; j < countForCustomer; j += 1) {
      const site = customerSites[j % customerSites.length];
      const contractName = `WB ${batchTag} Contract C${String(i + 1).padStart(2, '0')}-${j + 1}`;

      const existing = await supabase
        .from('contracts')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('name', contractName)
        .maybeSingle();
      if (existing.data?.id) {
        contractIds.push(existing.data.id);
        continue;
      }

      const startDate = addDays(new Date(), randInt(-10, 7));
      const endDate = addDays(startDate, randInt(120, 365));
      const insert = await supabase
        .from('contracts')
        .insert({
          tenant_id: tenantId,
          customer_id: customerId,
          job_site_id: site.id,
          name: contractName,
          type: pick(CONTRACT_TYPES),
          status: 'active',
          start_date: startDate.toISOString().slice(0, 10),
          end_date: endDate.toISOString().slice(0, 10),
          amount: randInt(800, 6400),
          billing_frequency: pick(BILLING_FREQUENCIES),
          description: 'Workbook seeded contract for scheduling and payroll dashboard testing.',
        })
        .select('id')
        .single();

      if (insert.error) {
        throw new Error(`Failed creating contract ${contractName}: ${insert.error.message}`);
      }
      contractIds.push(insert.data.id);
    }
  }
  return contractIds;
}

async function createScheduledJobs({
  supabase,
  tenantId,
  allCustomerIds,
  allJobSites,
  workerIds,
  contractorIds,
  checklistTemplates,
  batchTag,
}) {
  const startMonday = startOfNextMonday();
  const slotHours = [7, 9, 11, 13, 15, 17];

  let createdJobs = 0;
  for (let week = 0; week < WEEKS_TO_SCHEDULE; week += 1) {
    for (let dayOffset = 0; dayOffset < 5; dayOffset += 1) {
      const day = addDays(startMonday, week * 7 + dayOffset);
      for (let n = 0; n < JOBS_PER_WEEKDAY; n += 1) {
        const slot = slotHours[(n + dayOffset + week) % slotHours.length];
        const start = new Date(day);
        start.setHours(slot, [0, 10, 20, 30, 40, 50][(n + week) % 6], 0, 0);
        const durationMinutes = pick([60, 75, 90, 105, 120, 150]);
        const end = addMinutes(start, durationMinutes);

        const site = pick(allJobSites);
        const customerId = site.customer_id || pick(allCustomerIds);
        const title = `WB ${batchTag} Job W${week + 1}D${dayOffset + 1}-${n + 1}`;

        const insJob = await supabase
          .from('jobs')
          .insert({
            tenant_id: tenantId,
            customer_id: customerId,
            job_site_id: site.id,
            title,
            description: 'Workbook seeded scheduled job for workflow, payroll, and worker app testing.',
            status: 'scheduled',
            priority: pick(['low', 'normal', 'high']),
            start_time: toIsoLocal(start),
            end_time: toIsoLocal(end),
          })
          .select('id')
          .single();

        if (insJob.error) {
          throw new Error(`Failed creating job ${title}: ${insJob.error.message}`);
        }
        const jobId = insJob.data.id;

        const assignToWorker = Math.random() < 0.68 || contractorIds.length === 0;
        if (assignToWorker && workerIds.length) {
          const workerId = pick(workerIds);
          const assign = await supabase.from('job_assignments').insert({
            job_id: jobId,
            worker_id: workerId,
            status: 'assigned',
          });
          if (assign.error) {
            throw new Error(`Failed assigning worker to ${title}: ${assign.error.message}`);
          }
        } else if (contractorIds.length) {
          const contractorId = pick(contractorIds);
          const assign = await supabase.from('job_assignments').insert({
            job_id: jobId,
            contractor_id: contractorId,
            status: 'assigned',
          });
          if (assign.error) {
            throw new Error(`Failed assigning contractor to ${title}: ${assign.error.message}`);
          }
        }

        const checklistCount = randInt(1, 3);
        const used = new Set();
        for (let c = 0; c < checklistCount; c += 1) {
          const template = pick(checklistTemplates);
          if (!template?.id || used.has(template.id)) continue;
          used.add(template.id);

          let templateItems = template.items;
          if (typeof templateItems === 'string') {
            try {
              templateItems = JSON.parse(templateItems);
            } catch {
              templateItems = [];
            }
          }

          const checklistIns = await supabase.from('job_checklists').insert({
            job_id: jobId,
            checklist_template_id: template.id,
            items: Array.isArray(templateItems) ? templateItems : [],
          });
          if (checklistIns.error) {
            throw new Error(`Failed adding checklist to ${title}: ${checklistIns.error.message}`);
          }
        }

        createdJobs += 1;
      }
    }
  }

  return createdJobs;
}

async function run() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL/SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
  }
  if (!mapboxToken) {
    throw new Error('NEXT_PUBLIC_MAPBOX_TOKEN is required for generating real nearby addresses.');
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const slugHint = process.argv[2] || process.env.SEED_TENANT_SLUG;
  const tenant = await getOrCreateTargetTenant(supabase, slugHint);
  const batchTag = new Date().toISOString().slice(0, 16).replace(/[-:T]/g, '');

  console.log(`Seeding workbook data into tenant: ${tenant.name} (${tenant.slug})`);
  console.log(`Batch tag: ${batchTag}`);

  const before = await Promise.all([
    supabase.from('workers').select('id', { count: 'exact', head: true }).eq('tenant_id', tenant.id),
    supabase.from('contractors').select('id', { count: 'exact', head: true }).eq('tenant_id', tenant.id),
    supabase.from('customers').select('id', { count: 'exact', head: true }).eq('tenant_id', tenant.id),
    supabase.from('job_sites').select('id', { count: 'exact', head: true }).eq('tenant_id', tenant.id),
    supabase.from('jobs').select('id', { count: 'exact', head: true }).eq('tenant_id', tenant.id),
  ]);

  const internalResult = await createInternalWorkers(supabase, tenant.id, batchTag);
  console.log(`Added/ensured internal workers: ${internalResult.createdWorkerIds.length}`);

  const externalResult = await createExternalContractors(supabase, tenant.id, batchTag);
  console.log(`Added/ensured external contractors: ${externalResult.contractorIds.length}`);

  const newCustomerIds = await createCustomers(supabase, tenant.id, batchTag);
  console.log(`Added/ensured customers: ${newCustomerIds.length}`);

  const existingCustomersResult = await supabase
    .from('customers')
    .select('id')
    .eq('tenant_id', tenant.id)
    .eq('is_active', true);
  if (existingCustomersResult.error) throw existingCustomersResult.error;
  const allCustomerIds = existingCustomersResult.data.map((c) => c.id);

  const addresses = await collectJobSiteAddresses(mapboxToken, JOB_SITES_TO_ADD);
  console.log(`Generated ${addresses.length} unique nearby geocoded addresses.`);

  const createdSites = await createJobSites(supabase, tenant.id, allCustomerIds, addresses, batchTag);
  console.log(`Added job sites: ${createdSites.length}`);

  const existingSitesResult = await supabase
    .from('job_sites')
    .select('id,customer_id')
    .eq('tenant_id', tenant.id)
    .eq('is_active', true);
  if (existingSitesResult.error) throw existingSitesResult.error;

  const contractIds = await createContracts(supabase, tenant.id, allCustomerIds, existingSitesResult.data, batchTag);
  console.log(`Added/ensured contracts: ${contractIds.length}`);

  const checklistTemplates = await ensureChecklistTemplates(supabase, tenant.id);
  console.log(`Checklist templates available: ${checklistTemplates.length}`);

  const allWorkersRes = await supabase.from('workers').select('id').eq('tenant_id', tenant.id).eq('status', 'active');
  if (allWorkersRes.error) throw allWorkersRes.error;
  const allContractorsRes = await supabase.from('contractors').select('id').eq('tenant_id', tenant.id).eq('status', 'active');
  if (allContractorsRes.error) throw allContractorsRes.error;

  const jobsCreated = await createScheduledJobs({
    supabase,
    tenantId: tenant.id,
    allCustomerIds,
    allJobSites: existingSitesResult.data,
    workerIds: allWorkersRes.data.map((w) => w.id),
    contractorIds: allContractorsRes.data.map((c) => c.id),
    checklistTemplates,
    batchTag,
  });

  const after = await Promise.all([
    supabase.from('workers').select('id', { count: 'exact', head: true }).eq('tenant_id', tenant.id),
    supabase.from('contractors').select('id', { count: 'exact', head: true }).eq('tenant_id', tenant.id),
    supabase.from('customers').select('id', { count: 'exact', head: true }).eq('tenant_id', tenant.id),
    supabase.from('job_sites').select('id', { count: 'exact', head: true }).eq('tenant_id', tenant.id),
    supabase.from('jobs').select('id', { count: 'exact', head: true }).eq('tenant_id', tenant.id),
  ]);

  console.log('\nSeed complete:');
  console.table([
    { table: 'workers', before: before[0].count || 0, after: after[0].count || 0, delta: (after[0].count || 0) - (before[0].count || 0) },
    { table: 'contractors', before: before[1].count || 0, after: after[1].count || 0, delta: (after[1].count || 0) - (before[1].count || 0) },
    { table: 'customers', before: before[2].count || 0, after: after[2].count || 0, delta: (after[2].count || 0) - (before[2].count || 0) },
    { table: 'job_sites', before: before[3].count || 0, after: after[3].count || 0, delta: (after[3].count || 0) - (before[3].count || 0) },
    { table: 'jobs', before: before[4].count || 0, after: after[4].count || 0, delta: (after[4].count || 0) - (before[4].count || 0) },
  ]);
  console.log(`Scheduled jobs created in this run: ${jobsCreated}`);

  const knownCredentials = [
    ...internalResult.credentials,
    ...externalResult.credentials,
  ].sort((a, b) => a.email.localeCompare(b.email));

  const credentialDocPath = path.join(process.cwd(), 'docs', 'test-account-credentials.md');
  const generatedAt = new Date().toISOString();
  const lines = [
    '# Test Account Credentials',
    '',
    `Generated: ${generatedAt}`,
    `Tenant: ${tenant.name} (${tenant.slug})`,
    '',
    '## Workbook Seed Accounts',
    '',
    '| Email | Password | Role | Source |',
    '|---|---|---|---|',
    ...knownCredentials.map((c) => `| ${c.email} | ${c.password} | ${c.role} | ${c.source} |`),
    '',
    '## Existing Legacy Test Accounts',
    '',
    'These existed before this seed run. Passwords cannot be read from Supabase, so they are marked as unknown unless they were set by known scripts.',
    '',
    '| Email | Likely Password | Notes |',
    '|---|---|---|',
    '| owner@sparkle.com | password123 | From scripts/seed-users.ts |',
    '| lead1@sparkle.com | password123 | From scripts/seed-users.ts |',
    '| lead2@sparkle.com | password123 | From scripts/seed-users.ts |',
    '| worker1@sparkle.com | password123 | From scripts/seed-users.ts |',
    '| worker2@sparkle.com | password123 | From scripts/seed-users.ts |',
    '| worker3@sparkle.com | password123 | From scripts/seed-users.ts |',
    '| manager@fixit.com | password123 | From scripts/seed-users.ts |',
    '| tech1@fixit.com | password123 | From scripts/seed-users.ts |',
    '| tech2@fixit.com | password123 | From scripts/seed-users.ts |',
    '| pw-smoke-admin-20260509133001@example.com | unknown | Existing smoke admin account |',
    '| pw-smoke-worker-20260509134005@example.com | unknown | Existing smoke worker account |',
    '',
    'If you need to standardize or reset older passwords, use Admin > User Management in app settings or a Supabase password reset flow.',
    '',
  ];
  fs.writeFileSync(credentialDocPath, lines.join('\n'), 'utf8');
  console.log(`Credentials document written: ${credentialDocPath}`);
}

run().catch((err) => {
  console.error('Seeding failed:', err.message || err);
  process.exit(1);
});
