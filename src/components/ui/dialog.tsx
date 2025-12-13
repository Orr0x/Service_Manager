'use client';

import * as React from "react"
import { X } from "lucide-react"
import classNames from "classnames"

const Dialog = ({ children, open, onOpenChange }: { children: React.ReactNode; open?: boolean; onOpenChange?: (open: boolean) => void }) => {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="fixed inset-0 bg-black/50" onClick={() => onOpenChange?.(false)} />
            <div className="relative z-50 w-full max-w-lg p-4">
                {children}
            </div>
        </div>
    );
};

const DialogContent = ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={classNames("bg-white rounded-lg shadow-lg overflow-hidden", className)}>
        {children}
    </div>
);

const DialogHeader = ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={classNames("px-6 py-4 border-b border-gray-100", className)}>
        {children}
    </div>
);

const DialogTitle = ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <h3 className={classNames("text-lg font-bold text-gray-900", className)}>
        {children}
    </h3>
);

const DialogDescription = ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <p className={classNames("text-sm text-gray-500 mt-1", className)}>
        {children}
    </p>
);

const DialogFooter = ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={classNames("px-6 py-4 bg-gray-50 flex justify-end gap-2", className)}>
        {children}
    </div>
);

export { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter };
