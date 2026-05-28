'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Text from './text';
import clsx from 'clsx';
import { IoChevronDown } from 'react-icons/io5';

export interface DropdownOption {
    value: string;
    label: string;
    icon?: React.ReactNode;
}

interface DropdownProps {
    options: DropdownOption[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    icon?: React.ReactNode;
    showChevron?: boolean;
    className?: string;
    triggerClassName?: string;
    menuClassName?: string;
    renderMenuInPortal?: boolean;
    portalZIndex?: number;
}

const CheckIcon = ({ className }: { className?: string }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        className={className}
    >
        <path
            fillRule="evenodd"
            d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
            clipRule="evenodd"
        />
    </svg>
);

const Dropdown = ({
    options,
    value,
    onChange,
    placeholder = 'Select...',
    icon,
    showChevron = true,
    className,
    triggerClassName,
    menuClassName,
    renderMenuInPortal = false,
    portalZIndex = 9999,
}: DropdownProps) => {
    const selectedOption = options.find((opt) => opt.value === value);
    const [open, setOpen] = useState(false);
    const [menuPosition, setMenuPosition] = useState<{ top: number; left: number; width: number }>({
        top: 0,
        left: 0,
        width: 0,
    });
    const wrapperRef = useRef<HTMLDivElement | null>(null);
    const triggerRef = useRef<HTMLButtonElement | null>(null);
    const menuRef = useRef<HTMLDivElement | null>(null);

    const updateMenuPosition = () => {
        if (!triggerRef.current) return;
        const rect = triggerRef.current.getBoundingClientRect();
        setMenuPosition({
            top: rect.bottom + 8,
            left: rect.right - Math.max(rect.width, 160),
            width: Math.max(rect.width, 160),
        });
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const targetNode = event.target as Node;
            const clickedInsideWrapper = !!wrapperRef.current?.contains(targetNode);
            const clickedInsideMenu = !!menuRef.current?.contains(targetNode);
            if (!clickedInsideWrapper && !clickedInsideMenu) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (!open || !renderMenuInPortal) return;
        updateMenuPosition();
        const handleWindowChange = () => updateMenuPosition();
        window.addEventListener('resize', handleWindowChange);
        window.addEventListener('scroll', handleWindowChange, true);
        return () => {
            window.removeEventListener('resize', handleWindowChange);
            window.removeEventListener('scroll', handleWindowChange, true);
        };
    }, [open, renderMenuInPortal]);

    const menu = (
        <div
            ref={menuRef}
            className={clsx(
                "bg-primary border border-tertiary rounded-[10px] shadow-soft overflow-hidden z-50",
                renderMenuInPortal ? "fixed" : "absolute right-0 mt-2 min-w-[160px]",
                menuClassName
            )}
            style={
                renderMenuInPortal
                    ? { top: menuPosition.top, left: menuPosition.left, width: menuPosition.width, zIndex: portalZIndex, padding: '6px 0' }
                    : { padding: '6px 0' }
            }
        >
            <div className="flex flex-col">
                {options.map((option) => {
                    const isActive = value === option.value;
                    return (
                        <button
                            key={option.value}
                            type="button"
                            onClick={() => {
                                onChange(option.value);
                                setOpen(false);
                            }}
                            className={clsx(
                                'w-full text-left flex items-center justify-between gap-3 transition-colors duration-150',
                                isActive ? 'bg-accent-primary/10' : 'hover:bg-secondary'
                            )}
                            style={{ padding: '10px 16px' }}
                        >
                            <div className="flex items-center gap-2.5 min-w-0">
                                {option.icon && (
                                    <span className={isActive ? 'text-accent-primary' : 'text-text-secondary'}>
                                        {option.icon}
                                    </span>
                                )}
                                <Text
                                    variant={isActive ? 'body-sm-semibold' : 'body-sm'}
                                    className={isActive ? 'text-accent-primary truncate' : 'text-text-primary truncate'}
                                >
                                    {option.label}
                                </Text>
                            </div>
                            {isActive && <CheckIcon className="w-4 h-4 text-accent-primary shrink-0" />}
                        </button>
                    );
                })}
            </div>
        </div>
    );

    return (
        <div className={clsx('relative', className)} ref={wrapperRef}>
            <button
                ref={triggerRef}
                type="button"
                onClick={() => {
                    setOpen((prev) => {
                        const next = !prev;
                        if (next && renderMenuInPortal) updateMenuPosition();
                        return next;
                    });
                }}
                className={clsx(
                    'flex items-center gap-2 px-4 py-2.5 h-[40px] rounded-full',
                    'bg-primary shadow-soft cursor-pointer',
                    'transition-all duration-200 hover:bg-primary-light',
                    triggerClassName
                )}
            >
                {icon && <span className="text-text-secondary">{icon}</span>}
                <Text variant="body-sm" color="text-secondary" className="truncate max-w-[140px]">
                    {selectedOption?.label || placeholder}
                </Text>
                {showChevron && (
                    <IoChevronDown className="w-3 h-3 text-text-secondary" />
                )}
            </button>

            {open && (
                renderMenuInPortal ? createPortal(menu, document.body) : menu
            )}
        </div>
    );
};

export default Dropdown;
