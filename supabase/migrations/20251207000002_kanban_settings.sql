ALTER TABLE tenant_settings 
ADD COLUMN IF NOT EXISTS kanban_settings JSONB DEFAULT '{"columns": {"backlog": "Backlog", "unscheduled": "Unscheduled", "scheduled": "Scheduled", "in_progress": "In Progress", "completed": "Completed"}}';
