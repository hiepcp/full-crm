import * as React from 'react';
import PropTypes from 'prop-types';
import { NumberField as BaseNumberField } from '@base-ui/react/number-field';
import IconButton from '@mui/material/IconButton';
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import OutlinedInput from '@mui/material/OutlinedInput';
import InputAdornment from '@mui/material/InputAdornment';
import InputLabel from '@mui/material/InputLabel';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';

/**
 * This component is a placeholder for FormControl to correctly set the shrink label state on SSR.
 */
function SSRInitialFilled(_) {
  return null;
}
SSRInitialFilled.muiName = 'Input';

function NumberField({ 
  id: idProp, 
  label, 
  error, 
  helperText, 
  size = 'small',
  min,
  max,
  step,
  defaultValue,
  value,
  onChange,
  disabled,
  required,
  placeholder,
  InputProps,
  sx,
  ...other 
}) {
  let id = React.useId();
  if (idProp) {
    id = idProp;
  }

  // Generate helper text with min/max if provided
  const generatedHelperText = React.useMemo(() => {
    if (helperText) return helperText;
    if (min !== undefined && max !== undefined) {
      return `Enter value between ${min} and ${max}`;
    }
    if (min !== undefined) {
      return `Enter value greater than or equal to ${min}`;
    }
    if (max !== undefined) {
      return `Enter value less than or equal to ${max}`;
    }
    return '';
  }, [helperText, min, max]);

  return (
    <BaseNumberField.Root
      min={min}
      max={max}
      step={step}
      defaultValue={defaultValue}
      value={value}
      onValueChange={(newValue) => {
        if (onChange) {
          // Simulate event object for compatibility
          onChange({ target: { value: newValue, name: other.name } });
        }
      }}
      disabled={disabled}
      required={required}
      {...other}
      render={(props, state) => (
        <FormControl
          size={size}
          ref={props.ref}
          disabled={state.disabled}
          required={state.required}
          error={error}
          variant="outlined"
          fullWidth
          sx={sx}
        >
          {props.children}
        </FormControl>
      )}
    >
      <SSRInitialFilled {...other} />
      <InputLabel htmlFor={id}>{label}</InputLabel>
      <BaseNumberField.Input
        id={id}
        render={(props, state) => (
          <OutlinedInput
            label={label}
            inputRef={props.ref}
            value={state.inputValue}
            onBlur={props.onBlur}
            onChange={props.onChange}
            onKeyUp={props.onKeyUp}
            onKeyDown={props.onKeyDown}
            onFocus={props.onFocus}
            placeholder={placeholder}
            slotProps={{
              input: props,
            }}
            startAdornment={InputProps?.startAdornment}
            endAdornment={
              <InputAdornment
                position="end"
                sx={{
                  flexDirection: 'column',
                  maxHeight: 'unset',
                  alignSelf: 'stretch',
                  borderLeft: '1px solid',
                  borderColor: 'divider',
                  ml: 0,
                  '& button': {
                    py: 0,
                    flex: 1,
                    borderRadius: 0.5,
                  },
                }}
              >
                <BaseNumberField.Increment
                  render={<IconButton  size={size} aria-label="Increase" />}
                >
                  <KeyboardArrowUpIcon
                    sx={{ transform: 'translateY(1px)', fontSize: 16}}
                  />
                </BaseNumberField.Increment>

                <BaseNumberField.Decrement
                  render={<IconButton size={size} aria-label="Decrease" />}
                >
                  <KeyboardArrowDownIcon
                    sx={{ transform: 'translateY(-1px)', fontSize: 16 }}
                  />
                </BaseNumberField.Decrement>
              </InputAdornment>
            }
            sx={{ pr: 0}}
            
          />
        )}
      />
      <FormHelperText sx={{ ml: 0, '&:empty': { mt: 0 } }}>
        {generatedHelperText}
      </FormHelperText>
    </BaseNumberField.Root>
  );
}

NumberField.propTypes = {
  /**
   * If true, the input will indicate an error.
   */
  error: PropTypes.bool,
  /**
   * The helper text content.
   */
  helperText: PropTypes.node,
  /**
   * The id of the input element.
   */
  id: PropTypes.string,
  /**
   * Props applied to the Input element.
   */
  InputProps: PropTypes.object,
  /**
   * The label content.
   */
  label: PropTypes.node,
  /**
   * The maximum value.
   */
  max: PropTypes.number,
  /**
   * The minimum value.
   */
  min: PropTypes.number,
  /**
   * Name attribute of the input element.
   */
  name: PropTypes.string,
  /**
   * Callback fired when the value is changed.
   */
  onChange: PropTypes.func,
  /**
   * The short hint displayed in the input before the user enters a value.
   */
  placeholder: PropTypes.string,
  /**
   * If true, the label is displayed as required and the input element is required.
   */
  required: PropTypes.bool,
  /**
   * The size of the component.
   */
  size: PropTypes.oneOf(['medium', 'small']),
  /**
   * The amount to increment or decrement the value.
   */
  step: PropTypes.number,
  /**
   * The value of the input element.
   * system prop that allows defining system overrides as well as additional CSS styles.
   */
  sx: PropTypes.object,
  /**
   * The 
  value: PropTypes.number,
  /**
   * The default value. Use when the component is not controlled.
   */
  defaultValue: PropTypes.number,
  /**
   * If true, the component is disabled.
   */
  disabled: PropTypes.bool,
};

export default NumberField;
