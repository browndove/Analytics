"use client";

import * as React from "react";
import clsx from "clsx";

type DashboardCardProps = {
    children: React.ReactNode;
    className?: string;
    padding?: "none" | "sm" | "md" | "lg";
    borderColor?: string;
} & React.HTMLAttributes<HTMLDivElement>;

const paddingClasses = {
    none: "",
    sm: "p-3",
    md: "p-4",
    lg: "p-5",
};

const DashboardCard: React.FC<DashboardCardProps> = ({
    children,
    className,
    padding = "md",
    borderColor,
    style,
    ...rest
}) => {
    return (
        <div
            {...rest}
            className={clsx(
                "bg-primary rounded-[15px] shadow-soft",
                "transition-all duration-300 ease-out",
                "hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)] hover:-translate-y-0.5",
                paddingClasses[padding],
                borderColor && `border border-[${borderColor}]`,
                className
            )}
            style={borderColor ? { ...(style || {}), borderColor } : style}
        >
            {children}
        </div>
    );
};

export default DashboardCard;
