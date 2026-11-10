"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type ToolbarFilter = {
  key: string;
  label: string;
  options: { value: string; label: string }[];
};

/**
 * The search + filters + primary-action strip every list screen shares
 * (design §6.2). Filters live in the URL (`?q=…&status=…&page=…`), per
 * design §3.1: filters survive a refresh and a shared link, and the page
 * stays server-rendered. Search is debounced 300 ms; the result count is
 * announced into a polite live region (Requirement 8.5). Secondary
 * filters hide when Simple mode is on (Requirement 15.11).
 */
function Toolbar({
  searchKey = "q",
  searchPlaceholder,
  filters = [],
  primaryAction,
  resultCount,
  resultCountLabel,
  simpleMode = false,
}: {
  searchKey?: string;
  searchPlaceholder: string;
  filters?: ToolbarFilter[];
  primaryAction?: ReactNode;
  resultCount?: number;
  resultCountLabel?: (count: number) => string;
  simpleMode?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [searchValue, setSearchValue] = useState(searchParams.get(searchKey) ?? "");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function updateParam(key: string, value: string) {
    const next = new URLSearchParams(searchParams.toString());
    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    next.delete("page");
    router.replace(`${pathname}?${next.toString()}`);
  }

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => updateParam(searchKey, searchValue), 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchValue]);

  const visibleFilters = simpleMode ? filters.slice(0, 1) : filters;

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            type="search"
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
            className="pl-9"
          />
        </div>
        {visibleFilters.map((filter) => {
          const value = searchParams.get(filter.key) ?? "";
          return (
            <Select
              key={filter.key}
              value={value || "all"}
              onValueChange={(next) => updateParam(filter.key, next === "all" ? "" : next)}
            >
              <SelectTrigger aria-label={filter.label} className="w-full sm:w-48">
                <SelectValue placeholder={filter.label} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{filter.label}</SelectItem>
                {filter.options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          );
        })}
      </div>
      {primaryAction}
      {resultCount !== undefined && resultCountLabel && (
        <span role="status" aria-live="polite" className="sr-only">
          {resultCountLabel(resultCount)}
        </span>
      )}
    </div>
  );
}

export { Toolbar };
