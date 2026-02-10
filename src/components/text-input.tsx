import type { ComponentProps } from 'react'
import { Controller } from 'react-hook-form'
import type { ControllerProps, FieldPath, FieldValues } from 'react-hook-form'
import { Field, FieldError, FieldLabel } from './ui/field'
import { Input } from './ui/input'
import { PasswordInput } from './ui/password-input'

export const TextInput = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
  TTransformedValues = TFieldValues,
>({
  control,
  name,
  label,
  inputProps = {},
}: Pick<
  ControllerProps<TFieldValues, TName, TTransformedValues>,
  'control' | 'name'
> & {
  label: string
  inputProps?: ComponentProps<'input'>
}) => {
  const { type = 'text', autoComplete = 'on', ...rest } = inputProps

  // 1. Determine which component to use
  const isPassword = type === 'password'
  const InputComponent = isPassword ? PasswordInput : Input

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid} className="gap-2">
          <FieldLabel htmlFor={field.name}>{label}</FieldLabel>

          <InputComponent
            {...rest}
            {...field}
            id={field.name}
            autoComplete={autoComplete}
            aria-invalid={fieldState.invalid}
            // 2. Only pass 'type' if it's NOT a password field
            // (assuming PasswordInput handles its own type)
            {...(!isPassword && { type })}
          />

          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  )
}
