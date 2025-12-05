'use client'

import { useState } from 'react'
import { api } from '@/trpc/react'
import { format } from 'date-fns'
import { Send, Trash2 } from 'lucide-react'

interface NotesSectionProps {
    entityType: string
    entityId: string
}

export function NotesSection({ entityType, entityId }: NotesSectionProps) {
    const [content, setContent] = useState('')
    const utils = api.useUtils()

    const { data: notes, isLoading } = api.notes.getByEntity.useQuery({
        entityType,
        entityId,
    })

    const createNote = api.notes.create.useMutation({
        onSuccess: () => {
            setContent('')
            utils.notes.getByEntity.invalidate({ entityType, entityId })
        },
    })

    const deleteNote = api.notes.delete.useMutation({
        onSuccess: () => {
            utils.notes.getByEntity.invalidate({ entityType, entityId })
        },
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!content.trim()) return
        createNote.mutate({ content, entityType, entityId })
    }

    if (isLoading) return <div className="animate-pulse h-20 bg-gray-100 rounded"></div>

    return (
        <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl p-6">
            <h3 className="text-base font-semibold leading-7 text-gray-900 mb-4">Notes</h3>

            <div className="space-y-4 mb-6 max-h-60 overflow-y-auto">
                {notes && notes.length > 0 ? (
                    notes.map((note) => (
                        <div key={note.id} className="flex space-x-3">
                            <div className="flex-shrink-0">
                                <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600">
                                    {note.users?.first_name?.[0] || '?'}
                                </div>
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="text-sm font-medium text-gray-900">
                                    {note.users?.first_name} {note.users?.last_name}
                                </div>
                                <div className="text-sm text-gray-500">
                                    {format(new Date(note.created_at), 'MMM d, yyyy h:mm a')}
                                </div>
                                <div className="mt-1 text-sm text-gray-700 whitespace-pre-wrap">{note.content}</div>
                            </div>
                            <div className="flex-shrink-0">
                                <button
                                    onClick={() => deleteNote.mutate(note.id)}
                                    className="text-gray-400 hover:text-red-500"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="text-sm text-gray-500 italic">No notes yet.</p>
                )}
            </div>

            <form onSubmit={handleSubmit} className="relative">
                <div className="overflow-hidden rounded-lg shadow-sm ring-1 ring-inset ring-gray-300 focus-within:ring-2 focus-within:ring-[var(--primary-color)]">
                    <label htmlFor="comment" className="sr-only">
                        Add your note
                    </label>
                    <textarea
                        rows={3}
                        name="comment"
                        id="comment"
                        className="block w-full resize-none border-0 bg-transparent py-1.5 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm sm:leading-6"
                        placeholder="Add a note..."
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                    />

                    {/* Spacer to prevent overlap with button */}
                    <div className="py-2" aria-hidden="true">
                        <div className="py-px">
                            <div className="h-9" />
                        </div>
                    </div>
                </div>

                <div className="absolute inset-x-0 bottom-0 flex justify-between py-2 pl-3 pr-2">
                    <div className="flex items-center space-x-5">
                        {/* Can add attachment button here later if needed */}
                    </div>
                    <button
                        type="submit"
                        disabled={createNote.isPending || !content.trim()}
                        className="inline-flex items-center rounded-md bg-[var(--primary-color)] px-3 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
                    >
                        {createNote.isPending ? 'Sending...' : 'Add Note'}
                        <Send className="ml-2 h-4 w-4" />
                    </button>
                </div>
            </form>
        </div>
    )
}
