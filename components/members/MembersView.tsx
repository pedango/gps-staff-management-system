"use client";

import type { Member } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, Pencil, RotateCcw, Search, SlidersHorizontal, Trash2, UserPlus, UserRound, X } from "lucide-react";
import { FilterDropdownTrigger } from "@/components/members/FilterDropdownTrigger";
import { FilterPickerDialog } from "@/components/members/FilterPickerDialog";
import { formatFilterTriggerLabel } from "@/lib/filter-trigger-label";
import {
  LABEL_ADD_STAFF,
  LABEL_STAFF,
  LABEL_STAFFS,
} from "@/lib/ui-labels";
import { toast } from "sonner";
import { departmentAbbrev, formatDepartmentLabel } from "@/lib/departments";
import {
  getDepartmentFilterOptions,
  getMemberStatusFilterOptions,
  mergeFilterOptions,
  sanitizeFilterSelection,
  stringsToFilterOptions,
} from "@/lib/member-filter-options";
import type { MemberFilterFacets } from "@/lib/services/member-facets";
import { formatMemberName } from "@/lib/utils/format";
import { PageActionGold } from "@/components/ui/PageActions";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { MemberStatusBadge } from "@/components/members/MemberStatusBadge";
import { TYPE_CAPTION, TYPE_OVERLINE, UI_FILTER_INPUT } from "@/lib/ui-classes";
import { cn } from "@/lib/utils/cn";

type MembersResponse = {
  items: Member[];
  total: number;
  page: number;
  pageSize: number;
};

const STATUS_FILTER_OPTIONS = getMemberStatusFilterOptions();
const DEPARTMENT_FILTER_OPTIONS = getDepartmentFilterOptions();

const parseList = (value: string | null) =>
  (value ?? "")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);

export function MembersView() {
  const router = useRouter();
  const sp = useSearchParams();
  const queryString = sp.toString();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState(sp.get("q") ?? "");
  const [statusFilter, setStatusFilter] = useState<string[]>(() =>
    sanitizeFilterSelection(parseList(sp.get("status")), STATUS_FILTER_OPTIONS),
  );
  const [departmentFilter, setDepartmentFilter] = useState<string[]>(() =>
    sanitizeFilterSelection(parseList(sp.get("department")), DEPARTMENT_FILTER_OPTIONS),
  );
  const [divisionFilter, setDivisionFilter] = useState<string[]>(parseList(sp.get("division")));
  const [districtFilter, setDistrictFilter] = useState<string[]>(parseList(sp.get("district")));
  const [stationFilter, setStationFilter] = useState<string[]>(parseList(sp.get("station")));
  const [activeFilter, setActiveFilter] = useState<null | "status" | "department" | "division" | "district" | "station">(null);

  const filterSig = useMemo(
    () =>
      [
        search.trim(),
        statusFilter.join(","),
        departmentFilter.join(","),
        divisionFilter.join(","),
        districtFilter.join(","),
        stationFilter.join(","),
      ].join("|"),
    [search, statusFilter, departmentFilter, divisionFilter, districtFilter, stationFilter],
  );
  const prevSig = useRef<string | null>(null);

  useEffect(() => {
    const next = new URLSearchParams(sp.toString());
    const apply = (key: string, value: string | string[]) => {
      const v = Array.isArray(value) ? value.join(",") : value.trim();
      if (v) next.set(key, v);
      else next.delete(key);
    };
    apply("q", search);
    apply("status", statusFilter);
    apply("department", departmentFilter);
    apply("division", divisionFilter);
    apply("district", districtFilter);
    apply("station", stationFilter);

    if (prevSig.current === null) {
      prevSig.current = filterSig;
    } else if (prevSig.current !== filterSig) {
      prevSig.current = filterSig;
      next.set("page", "1");
    }

    const qs = next.toString();
    if (qs === sp.toString()) {
      return;
    }
    router.replace(`/members?${qs}`);
  }, [filterSig, router, search, sp, statusFilter, departmentFilter, divisionFilter, districtFilter, stationFilter]);

  const { data, isPending, isError } = useQuery({
    queryKey: ["members", queryString],
    queryFn: async (): Promise<MembersResponse> => {
      const res = await fetch(`/api/members?${queryString}`);
      if (!res.ok) {
        throw new Error("Failed to load members");
      }
      return (await res.json()) as MembersResponse;
    },
  });

  const { data: facets, isPending: facetsLoading } = useQuery({
    queryKey: ["members-filters"],
    queryFn: async (): Promise<MemberFilterFacets> => {
      const res = await fetch("/api/members/filters");
      if (!res.ok) {
        throw new Error("Failed to load filter options");
      }
      return (await res.json()) as MemberFilterFacets;
    },
    staleTime: 60_000,
  });

  const divisionOptions = useMemo(
    () => mergeFilterOptions(stringsToFilterOptions(facets?.divisions ?? []), divisionFilter),
    [facets?.divisions, divisionFilter],
  );
  const districtOptions = useMemo(
    () => mergeFilterOptions(stringsToFilterOptions(facets?.districts ?? []), districtFilter),
    [facets?.districts, districtFilter],
  );
  const stationOptions = useMemo(
    () => mergeFilterOptions(stringsToFilterOptions(facets?.stations ?? []), stationFilter),
    [facets?.stations, stationFilter],
  );

  useEffect(() => {
    const cleanStatus = sanitizeFilterSelection(statusFilter, STATUS_FILTER_OPTIONS);
    if (cleanStatus.length !== statusFilter.length) setStatusFilter(cleanStatus);

    const cleanDept = sanitizeFilterSelection(departmentFilter, DEPARTMENT_FILTER_OPTIONS);
    if (cleanDept.length !== departmentFilter.length) setDepartmentFilter(cleanDept);

    const cleanDiv = sanitizeFilterSelection(divisionFilter, divisionOptions);
    if (cleanDiv.length !== divisionFilter.length) setDivisionFilter(cleanDiv);

    const cleanDist = sanitizeFilterSelection(districtFilter, districtOptions);
    if (cleanDist.length !== districtFilter.length) setDistrictFilter(cleanDist);

    const cleanStation = sanitizeFilterSelection(stationFilter, stationOptions);
    if (cleanStation.length !== stationFilter.length) setStationFilter(cleanStation);
  }, [
    departmentFilter,
    districtFilter,
    districtOptions,
    divisionFilter,
    divisionOptions,
    stationFilter,
    stationOptions,
    statusFilter,
  ]);

  const [deleteId, setDeleteId] = useState<string | null>(null);

  const onConfirmDelete = useCallback(async () => {
    if (!deleteId) return;
    const res = await fetch(`/api/members/${deleteId}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error(`Could not delete ${LABEL_STAFF.toLowerCase()}`);
      return;
    }
    toast.success(`${LABEL_STAFF} deleted`);
    await queryClient.invalidateQueries({ queryKey: ["members"] });
    setDeleteId(null);
  }, [deleteId, queryClient]);

  const page = data?.page ?? Math.max(1, Number.parseInt(sp.get("page") ?? "1", 10) || 1);
  const pageSize = data?.pageSize ?? 20;
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  const goPage = (p: number) => {
    const next = new URLSearchParams(sp.toString());
    next.set("page", String(Math.max(1, Math.min(p, totalPages))));
    router.push(`/members?${next.toString()}`);
  };

  const clearFilters = () => {
    setSearch("");
    setStatusFilter([]);
    setDepartmentFilter([]);
    setDivisionFilter([]);
    setDistrictFilter([]);
    setStationFilter([]);
    router.replace("/members?page=1");
  };

  const statusFilterApplied = useMemo(
    () => sanitizeFilterSelection(statusFilter, STATUS_FILTER_OPTIONS),
    [statusFilter],
  );
  const departmentFilterApplied = useMemo(
    () => sanitizeFilterSelection(departmentFilter, DEPARTMENT_FILTER_OPTIONS),
    [departmentFilter],
  );
  const divisionFilterApplied = useMemo(
    () => sanitizeFilterSelection(divisionFilter, divisionOptions),
    [divisionFilter, divisionOptions],
  );
  const districtFilterApplied = useMemo(
    () => sanitizeFilterSelection(districtFilter, districtOptions),
    [districtFilter, districtOptions],
  );
  const stationFilterApplied = useMemo(
    () => sanitizeFilterSelection(stationFilter, stationOptions),
    [stationFilter, stationOptions],
  );

  const showEmpty = !isPending && data && data.items.length === 0;
  const hasAnyFilter =
    search.trim().length > 0 ||
    statusFilterApplied.length > 0 ||
    departmentFilterApplied.length > 0 ||
    divisionFilterApplied.length > 0 ||
    districtFilterApplied.length > 0 ||
    stationFilterApplied.length > 0;

  return (
    <div className="app-page">
      <div className="mb-5 flex items-center justify-between gap-3">
        <p className={TYPE_CAPTION}>
          Eastern North Region · <span className="font-medium text-navy-600">{total.toLocaleString()} personnel on record</span>
        </p>
        <PageActionGold href="/members/add">
          <UserPlus className="h-4 w-4" aria-hidden />
          {LABEL_ADD_STAFF}
        </PageActionGold>
      </div>

      <div className="mb-4">
        <div className="search-wrapper mb-3">
          <Search className="search-icon" aria-hidden />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search any detail — name, rank, station, status..."
            className={cn(UI_FILTER_INPUT, "search-input pr-10")}
            aria-label="Search any detail — name, rank, station, status"
          />
          {search ? (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full bg-navy-200 text-navy-600 transition-colors hover:bg-navy-300"
              aria-label="Clear search"
            >
              <X className="h-3 w-3" />
            </button>
          ) : null}
        </div>

        <div className="members-filter-toolbar">
          <button
            type="button"
            className={cn("filter-toolbar-icon", hasAnyFilter && "filter-toolbar-icon--active")}
            onClick={() => setActiveFilter("status")}
            aria-label="Open filters"
            title="Filters"
          >
            <SlidersHorizontal className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />
          </button>

          <div className="members-filter-bar scrollbar-hide">
            <FilterDropdownTrigger
              label={formatFilterTriggerLabel("All statuses", statusFilterApplied, STATUS_FILTER_OPTIONS)}
              active={statusFilterApplied.length > 0}
              onClick={() => setActiveFilter("status")}
            />
            <FilterDropdownTrigger
              label={formatFilterTriggerLabel("All departments", departmentFilterApplied, DEPARTMENT_FILTER_OPTIONS, 22)}
              active={departmentFilterApplied.length > 0}
              onClick={() => setActiveFilter("department")}
            />
            <FilterDropdownTrigger
              label={formatFilterTriggerLabel("All divisions", divisionFilterApplied, divisionOptions)}
              active={divisionFilterApplied.length > 0}
              onClick={() => setActiveFilter("division")}
            />
            <FilterDropdownTrigger
              label={formatFilterTriggerLabel("All districts", districtFilterApplied, districtOptions)}
              active={districtFilterApplied.length > 0}
              onClick={() => setActiveFilter("district")}
            />
            <FilterDropdownTrigger
              label={formatFilterTriggerLabel("All stations", stationFilterApplied, stationOptions)}
              active={stationFilterApplied.length > 0}
              onClick={() => setActiveFilter("station")}
            />
          </div>

          <button
            type="button"
            onClick={clearFilters}
            disabled={!hasAnyFilter}
            className="filter-toolbar-reset"
            aria-label="Reset all filters"
          >
            <RotateCcw className="h-4 w-4" strokeWidth={2} aria-hidden />
            <span>Reset</span>
          </button>
        </div>
        <p className="mt-2 text-xs text-navy-400">
          Showing {data?.items.length ?? 0} of {total.toLocaleString()} {LABEL_STAFFS.toLowerCase()}
        </p>
      </div>

      <FilterPickerDialog
        open={activeFilter === "status"}
        onOpenChange={(open) => setActiveFilter(open ? "status" : null)}
        title="Filter by status"
        options={STATUS_FILTER_OPTIONS}
        selected={statusFilterApplied}
        onApply={setStatusFilter}
      />
      <FilterPickerDialog
        open={activeFilter === "department"}
        onOpenChange={(open) => setActiveFilter(open ? "department" : null)}
        title="Filter by department"
        options={DEPARTMENT_FILTER_OPTIONS}
        selected={departmentFilterApplied}
        onApply={setDepartmentFilter}
        searchable
      />
      <FilterPickerDialog
        open={activeFilter === "division"}
        onOpenChange={(open) => setActiveFilter(open ? "division" : null)}
        title="Filter by division"
        options={divisionOptions}
        selected={divisionFilterApplied}
        onApply={setDivisionFilter}
        searchable
        loading={facetsLoading}
        emptyMessage="No divisions on record yet. Add a staff member to populate this list."
      />
      <FilterPickerDialog
        open={activeFilter === "district"}
        onOpenChange={(open) => setActiveFilter(open ? "district" : null)}
        title="Filter by district"
        options={districtOptions}
        selected={districtFilterApplied}
        onApply={setDistrictFilter}
        searchable
        loading={facetsLoading}
        emptyMessage="No districts on record yet. Add a staff member to populate this list."
      />
      <FilterPickerDialog
        open={activeFilter === "station"}
        onOpenChange={(open) => setActiveFilter(open ? "station" : null)}
        title="Filter by station"
        options={stationOptions}
        selected={stationFilterApplied}
        onApply={setStationFilter}
        searchable
        loading={facetsLoading}
        emptyMessage="No stations on record yet. Add a staff member to populate this list."
      />

      <div className="staff-records-panel min-h-[70vh]">
        {isPending ? (
          <div className="app-loading-rows">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg bg-navy-100" />
            ))}
          </div>
        ) : isError ? (
          <div className="app-error-banner m-4" role="alert">
            Unable to load members. Check your connection and try again.
          </div>
        ) : showEmpty ? (
          <EmptyState
            title={`No ${LABEL_STAFFS.toLowerCase()} found`}
            description="Adjust your filters or add a new personnel record to get started."
            action={
              <PageActionGold href="/members/add">
                <UserPlus className="h-4 w-4" aria-hidden />
                {LABEL_ADD_STAFF}
              </PageActionGold>
            }
          />
        ) : (
          <>
            <div className="space-y-2 sm:hidden">
              {data?.items.map((m) => (
                <div key={m.id} className="flex items-center gap-4 rounded-xl border border-navy-100 bg-white p-4">
                  <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-xl bg-navy-100">
                    {m.photo ? <Image src={m.photo} alt="" fill className="object-cover" sizes="48px" /> : null}
                    {!m.photo ? (
                      <div className="flex h-full w-full items-center justify-center text-sm font-bold text-navy-600">
                        {m.firstName.slice(0, 1)}
                        {m.lastName.slice(0, 1)}
                      </div>
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-navy-900">{formatMemberName(m.firstName, m.lastName, m.otherNames)}</p>
                    <p className="mt-0.5 truncate text-xs text-navy-400">
                      {m.rank} · {formatDepartmentLabel(m.department)}
                    </p>
                    <div className="mt-1.5 flex items-center gap-2">
                      <MemberStatusBadge status={m.status} />
                      <span className={TYPE_CAPTION}>{m.station}</span>
                    </div>
                  </div>
                  <div className="flex flex-shrink-0 flex-col gap-1.5">
                    <Link href={`/members/${m.id}`} className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy-50 text-navy-500">
                      <Eye className="h-3.5 w-3.5" />
                    </Link>
                    <Link href={`/members/${m.id}/edit`} className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy-50 text-navy-500">
                      <Pencil className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            <div className="app-data-table-wrap hidden sm:block">
              <table className="app-data-table">
                <thead>
                  <tr>
                    <th scope="col">{LABEL_STAFF}</th>
                    <th scope="col">Department</th>
                    <th scope="col">Division</th>
                    <th scope="col">District</th>
                    <th scope="col">Station</th>
                    <th scope="col">Status</th>
                    <th scope="col" className="app-th-center">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data?.items.map((m) => (
                    <tr key={m.id}>
                      <td>
                        <Link href={`/members/${m.id}`} className="app-table-member-link">
                          <span className="app-table-avatar">
                            {m.photo ? <Image src={m.photo} alt="" fill className="object-cover" sizes="40px" /> : null}
                            {!m.photo ? (
                              <span className={cn(TYPE_OVERLINE, "font-bold text-navy-600")}>
                                {m.firstName.slice(0, 1)}
                                {m.lastName.slice(0, 1)}
                              </span>
                            ) : null}
                          </span>
                          <span>
                            <span className="app-table-member-name">
                              {formatMemberName(m.firstName, m.lastName, m.otherNames)}
                            </span>
                            <span className="app-table-member-rank">{m.rank}</span>
                          </span>
                        </Link>
                      </td>
                      <td>
                        <span className="app-dept-badge" title={formatDepartmentLabel(m.department)}>
                          {departmentAbbrev(m.department)}
                        </span>
                      </td>
                      <td className="text-[#374151]">{m.division}</td>
                      <td className="text-[#374151]">{m.district}</td>
                      <td className="text-[#374151]">{m.station}</td>
                      <td>
                        <MemberStatusBadge status={m.status} />
                      </td>
                      <td>
                        <div className="app-table-actions">
                          <Link
                            href={`/members/${m.id}`}
                            title="View profile"
                            className="app-table-action-btn"
                            aria-label={`View ${formatMemberName(m.firstName, m.lastName, m.otherNames)}`}
                          >
                            <UserRound className="h-4 w-4" />
                          </Link>
                          <Link
                            href={`/members/${m.id}/edit`}
                            title="Edit member"
                            className="app-table-action-btn"
                            aria-label={`Edit ${formatMemberName(m.firstName, m.lastName, m.otherNames)}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Link>
                          <button
                            type="button"
                            title="Delete member"
                            className="app-table-action-btn app-table-action-btn--danger"
                            aria-label={`Delete ${formatMemberName(m.firstName, m.lastName, m.otherNames)}`}
                            onClick={() => setDeleteId(m.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="app-table-footer">
              <p className="app-table-footer-meta">
                Showing {from}–{to} of {total.toLocaleString()} {LABEL_STAFFS.toLowerCase()}
              </p>
              <div className="app-pagination">
                <button
                  type="button"
                  className="app-pagination-btn"
                  disabled={page <= 1}
                  onClick={() => goPage(page - 1)}
                >
                  Prev
                </button>
                {(() => {
                  let end = Math.min(totalPages, Math.max(page + 2, Math.min(5, totalPages)));
                  let start = Math.max(1, end - 4);
                  end = Math.min(totalPages, start + 4);
                  start = Math.max(1, end - 4);
                  const pages = Array.from({ length: end - start + 1 }, (_, i) => start + i);
                  return pages.map((n) => (
                    <button
                      key={n}
                      type="button"
                      className={cn("app-pagination-btn", n === page && "app-pagination-btn--active")}
                      onClick={() => goPage(n)}
                      aria-current={n === page ? "page" : undefined}
                    >
                      {n}
                    </button>
                  ));
                })()}
                <button
                  type="button"
                  className="app-pagination-btn"
                  disabled={page >= totalPages}
                  onClick={() => goPage(page + 1)}
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(deleteId)}
        onOpenChange={(open) => {
          if (!open) setDeleteId(null);
        }}
        title="Confirm Deletion"
        description={`This action permanently removes the ${LABEL_STAFF.toLowerCase()} from the directory.`}
        confirmLabel="Delete Record"
        onConfirm={onConfirmDelete}
        tone="danger"
      />
    </div>
  );
}
