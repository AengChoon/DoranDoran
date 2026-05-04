import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

// arbitrary value 그림자 — theme.extend 의존 제거. 항상 동작 보장.
const SHADOW = {
  green: "shadow-[0_4px_0_0_#58A700] active:shadow-[0_0_0_0_#58A700]",
  blue: "shadow-[0_4px_0_0_#1899D6] active:shadow-[0_0_0_0_#1899D6]",
  red: "shadow-[0_4px_0_0_#CC3B3B] active:shadow-[0_0_0_0_#CC3B3B]",
  warm: "shadow-[0_4px_0_0_#E05656] active:shadow-[0_0_0_0_#E05656]",
  yellow: "shadow-[0_4px_0_0_#E0A800] active:shadow-[0_0_0_0_#E0A800]",
  gray: "shadow-[0_4px_0_0_#C5C5C5] active:shadow-[0_0_0_0_#C5C5C5]",
} as const;

/**
 * Link 등에 동일한 버튼 스타일을 입히고 싶을 때 사용.
 * 사용: <Link className={buttonVariants({ variant: "primary", size: "lg" })}>...</Link>
 */
export const buttonVariants = (
  props?: VariantProps<typeof button>,
) => button(props);

const button = cva("btn-duo", {
  variants: {
    variant: {
      primary: `bg-duo-green text-white ${SHADOW.green} hover:brightness-105`,
      secondary: `bg-duo-blue text-white ${SHADOW.blue} hover:brightness-105`,
      danger: `bg-duo-red text-white ${SHADOW.red} hover:brightness-105`,
      warm: `bg-doran-warm text-white ${SHADOW.warm} hover:brightness-105`,
      yellow: `bg-duo-yellow text-white ${SHADOW.yellow} hover:brightness-105`,
      ghost: `bg-white text-duo-text border-2 border-duo-border ${SHADOW.gray} hover:bg-duo-bg-muted`,
    },
    size: {
      sm: "h-10 px-4 text-sm",
      md: "h-12 px-5 text-base",
      lg: "h-14 px-7 text-lg",
      block: "h-14 w-full px-7 text-lg",
    },
  },
  defaultVariants: {
    variant: "primary",
    size: "md",
  },
});

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof button>;

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  function Button({ className, variant, size, type = "button", ...rest }, ref) {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(button({ variant, size }), className)}
        {...rest}
      />
    );
  },
);
