export {};

declare global {
  interface HTMLElement {
    disabled: boolean;
    value: string;
    checked: boolean;
  }
}
