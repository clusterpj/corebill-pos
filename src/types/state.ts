export interface State {
  id: number;
  code: string;
  name: string;
  country_code: string;
}

export interface StateResponse {
  states: State[];
}

export interface StateDropdownProps {
  modelValue: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  countryCode?: string;
}
