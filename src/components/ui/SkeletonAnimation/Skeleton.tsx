import { ReactNode } from "react";
import styles from "./Skeleton.module.css";

interface SkeletonProps {
    children: ReactNode;
    isLoading: boolean;
    variant?: "text" | "rectangular";
    fullWidth?: boolean;
}

export default function Skeleton({
                                     children,
                                     isLoading,
                                     variant = "text",
                                     fullWidth = false
                                 }: SkeletonProps) {
    return (
        <div
            className={styles.wrapper}
            data-loading={isLoading}
            data-full={fullWidth}
        >
            <div className={styles.content}>
                {children}
            </div>
            {isLoading && (
                <div className={`${styles.skeleton} ${styles[variant]}`} />
            )}
        </div>
    );
}