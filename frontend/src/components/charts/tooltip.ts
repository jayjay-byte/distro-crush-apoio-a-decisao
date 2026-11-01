/** Props que o Recharts passa ao `content` do Tooltip (só o que usamos). */
export type TooltipProps<T> = {
  active?: boolean
  payload?: readonly { payload?: T }[]
}

/** Item sob o cursor, se houver. */
export function tooltipItem<T>({ active, payload }: TooltipProps<T>): T | null {
  return active && payload?.[0]?.payload ? payload[0].payload : null
}
