import * as React from "react";
import {
    InputBase,
    InputBaseAdornment,
    InputBaseControl,
    InputBaseInput,
} from "@/components/ui/input-base";

interface BetterInputProps extends React.ComponentProps<"input"> {
    prefixAdornment?: React.ReactNode;
    postAdornment?: React.ReactNode;
}

export const BetterInput = React.forwardRef<HTMLInputElement, BetterInputProps>(
    ({ prefixAdornment, postAdornment, ...inputProps }, ref) => {
        return (
            <InputBase>
                {prefixAdornment && (
                    <InputBaseAdornment>
                        {prefixAdornment}
                    </InputBaseAdornment>
                )}
                <InputBaseControl>
                    <InputBaseInput {...inputProps} ref={ref} />
                </InputBaseControl>
                {postAdornment && (
                    <InputBaseAdornment>
                        {postAdornment}
                    </InputBaseAdornment>
                )}
            </InputBase>
        );
    }
);
BetterInput.displayName = "BetterInput";