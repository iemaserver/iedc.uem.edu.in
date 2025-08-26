"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface MultiSelectProps<T> {
  data: T[];
  visibility: (keyof T)[];
  searchFields: (keyof T)[];
  idField: keyof T;
  placeholder?: string;
  onChange: (selectedIds: (T[keyof T])[]) => void;
}



export function MultiSelect<T extends Record<string, any>>({
  data,
  visibility,
  searchFields,
  idField,
  placeholder = "Select...",
  onChange,
}: MultiSelectProps<T>) {
  const [selectedItems, setSelectedItems] = React.useState<T[]>([]);
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");

  const handleSelect = (item: T) => {
    const exists = selectedItems.find(i => i[idField] === item[idField]);
    const newSelected = exists
      ? selectedItems.filter(i => i[idField] !== item[idField])
      : [...selectedItems, item];

    setSelectedItems(newSelected);
    onChange(newSelected.map(i => i[idField]));
  };

  const filteredData = React.useMemo(
  () =>
    data.filter(item =>
      searchFields.some(field =>
        String(item[field]).toLowerCase().includes(search.toLowerCase())
      )
    ),
  [data, search, searchFields]
);
  return (
    <div className="w-full relative">
      {/* Selected badges */}
      <div className="flex flex-wrap gap-2 mb-2">
        {selectedItems.map(item => (
          <Badge key={String(item[idField])} variant="secondary">
            {visibility.map((field, idx) => (
              <span key={idx}>
                {item[field]}
                {idx < visibility.length - 1 ? " | " : ""}
              </span>
            ))}
          </Badge>
        ))}
      </div>

      {/* Dropdown button */}
      <Button
        variant="outline"
        className="w-full text-left"
        onClick={() => setOpen(prev => !prev)}
      >
        {selectedItems.length > 0
          ? `${selectedItems.length} selected`
          : placeholder}
      </Button>

      {/* Custom dropdown */}
      {open && (
        <div className="absolute z-50 w-full mt-1 bg-white border rounded shadow-lg max-h-64 overflow-y-auto">
          <div className="p-2">
            <Input
              placeholder="Search..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="mb-2"
            />
            <div className="flex flex-col gap-1">
              {filteredData.length === 0 && (
                <div className="text-sm text-gray-500 p-2">No results found</div>
              )}
              {filteredData.map(item => {
                const isSelected = selectedItems.some(i => i[idField] === item[idField]);
                return (
                  <div
                    key={String(item[idField])}
                    className="flex items-center justify-between p-2 rounded hover:bg-gray-100 cursor-pointer"
                    onClick={() => handleSelect(item)}
                  >
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => handleSelect(item)}
                      />
                      <div className="flex flex-col">
                        {visibility.map((field, idx) => (
                          <span key={idx} className="text-sm">
                            {item[field]}
                          </span>
                        ))}
                      </div>
                    </div>
                    {isSelected && <span className="text-blue-500 font-bold">✓</span>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
