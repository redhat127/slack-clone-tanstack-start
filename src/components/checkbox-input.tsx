import type { ControllerProps, FieldPath, FieldValues } from 'react-hook-form'
import { Controller } from 'react-hook-form'
import { Checkbox } from './ui/checkbox'
import { Field, FieldContent, FieldError, FieldLabel } from './ui/field'

export const CheckboxInput = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
  TTransformedValues = TFieldValues,
>({
  control,
  name: inputName,
  label,
}: Pick<
  ControllerProps<TFieldValues, TName, TTransformedValues>,
  'control' | 'name'
> & { label: string }) => {
  return (
    <Controller
      control={control}
      name={inputName}
      render={({
        field: { name, onBlur, onChange, ref, value, disabled },
        fieldState,
      }) => {
        return (
          <Field
            orientation="horizontal"
            data-invalid={fieldState.invalid}
            className="gap-2"
          >
            <Checkbox
              name={name}
              onBlur={onBlur}
              onCheckedChange={onChange}
              ref={ref}
              checked={value}
              disabled={disabled}
              id={name}
              aria-invalid={fieldState.invalid}
            />
            <FieldContent>
              <FieldLabel htmlFor={name}>{label}</FieldLabel>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </FieldContent>
          </Field>
        )
      }}
    />
  )
}
