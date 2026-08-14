import { FilterBar, FilterChip } from "../FilterBar";

export interface InventoryFilterOption {
  id: string;
  label: string;
}

export function InventoryFilters({
  options,
  value,
  onChange,
}: {
  options: InventoryFilterOption[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <FilterBar>
      {options.map((option) => (
        <FilterChip
          key={option.id}
          label={option.label}
          active={value === option.id}
          onClick={() => onChange(option.id)}
        />
      ))}
    </FilterBar>
  );
}
