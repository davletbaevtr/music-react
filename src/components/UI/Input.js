import {forwardRef} from "react";
import {TextField} from "@mui/material";

export const Input = forwardRef((props, ref) => {
    return (
        <TextField
            variant="outlined"
            margin="normal"
            sx={{
                '& .MuiInputLabel-root': {
                    fontWeight: 500,
                },
                '& .MuiFormHelperText-root': {
                    fontWeight: 300,
                }
            }}
            inputRef={ref}
            fullWidth
            {...props}
        />
    );
});