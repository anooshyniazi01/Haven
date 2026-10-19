import React, { useState, useEffect, useCallback } from "react";
import { Alert } from "../../components/feedback/Alert";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { StatusBadge } from "../../components/feedback/StatusBadge";
import { listEvidence } from "../../services/evidence";
import {
  createIncident,
  deleteIncident,
  getIncidentById,
  listIncidents,
  updateIncident,
} from "../../services/incident";
import { EvidenceItem } from "../../types/evidence";
import {
  IncidentCreatePayload,
  IncidentDetail,
  IncidentItem,
  IncidentStatus,
} from "../../types/incident";
import { formatBytes, formatTimestamp, truncateHash } from "../../utils/formatters";

export interface IncidentTrackerProps {
  onNavigateToVault?: (evidenceId?: string) => void;
}

export const IncidentTracker: React.FC<IncidentTrackerProps> = ({
  onNavigateToVault,
}) => {
  // List State
  const [incidents, setIncidents] = useState<IncidentItem[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters and Pagination
  const [statusFilter, setStatusFilter] = useState<"all" | IncidentStatus>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [appliedSearch, setAppliedSearch] = useState<string>("");
  const [limit] = useState<number>(10);
  const [offset, setOffset] = useState<number>(0);

  // Selected Detail State
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [incidentDetail, setIncidentDetail] = useState<IncidentDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState<boolean>(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);

  // Edit Form State
  const [editTitle, setEditTitle] = useState<string>("");
  const [editDescription, setEditDescription] = useState<string>("");
  const [editIncidentDate, setEditIncidentDate] = useState<string>("");
  const [editStatus, setEditStatus] = useState<IncidentStatus>("open");
  const [editEvidenceIds, setEditEvidenceIds] = useState<string[]>([]);
  const [editSubmitting, setEditSubmitting] = useState<boolean>(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Create Form State
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [createTitle, setCreateTitle] = useState<string>("");
  const [createDescription, setCreateDescription] = useState<string>("");
  const [createIncidentDate, setCreateIncidentDate] = useState<string>("");
  const [createStatus, setCreateStatus] = useState<IncidentStatus>("open");
  const [createEvidenceIds, setCreateEvidenceIds] = useState<string[]>([]);
  const [createSubmitting, setCreateSubmitting] = useState<boolean>(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Available Evidence for Linking
  const [vaultEvidence, setVaultEvidence] = useState<EvidenceItem[]>([]);
  const [loadingEvidence, setLoadingEvidence] = useState<boolean>(false);

  // Delete Confirmation State
  const [deleteTargetIncident, setDeleteTargetIncident] = useState<IncidentItem | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState<boolean>(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Copy helper
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Load Incidents List
  const fetchIncidents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listIncidents({
        limit,
        offset,
        status: statusFilter === "all" ? undefined : statusFilter,
        search: appliedSearch || undefined,
      });
      setIncidents(res.items);
      setTotal(res.total);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load incidents.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [limit, offset, statusFilter, appliedSearch]);

  useEffect(() => {
    fetchIncidents();
  }, [fetchIncidents]);

  // Load Available Evidence for selection
  const fetchVaultEvidence = useCallback(async () => {
    setLoadingEvidence(true);
    try {
      const res = await listEvidence({ limit: 100, offset: 0 });
      setVaultEvidence(res.items);
    } catch {
      // Evidence loading failure non-fatal to incident tracker
    } finally {
      setLoadingEvidence(false);
    }
  }, []);

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setCreateTitle("");
    setCreateDescription("");
    setCreateIncidentDate("");
    setCreateStatus("open");
    setCreateEvidenceIds([]);
    setCreateError(null);
    setShowCreateModal(true);
    fetchVaultEvidence();
  };

  // Submit Create Incident
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createTitle.trim()) {
      setCreateError("Incident title is required.");
      return;
    }

    setCreateSubmitting(true);
    setCreateError(null);

    const payload: IncidentCreatePayload = {
      title: createTitle.trim(),
      description: createDescription.trim() ? createDescription.trim() : null,
      incident_date: createIncidentDate ? createIncidentDate : null,
      status: createStatus,
      evidence_ids: createEvidenceIds,
    };

    try {
      const created = await createIncident(payload);
      setShowCreateModal(false);
      await fetchIncidents();
      // Automatically open the new incident details
      handleOpenDetail(created.id);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create incident.";
      setCreateError(msg);
    } finally {
      setCreateSubmitting(false);
    }
  };

  // Open Incident Detail
  const handleOpenDetail = async (id: string) => {
    setSelectedIncidentId(id);
    setDetailLoading(true);
    setDetailError(null);
    setIsEditing(false);
    setEditError(null);

    try {
      const detail = await getIncidentById(id);
      setIncidentDetail(detail);
      // Initialize edit form
      setEditTitle(detail.title);
      setEditDescription(detail.description || "");
      setEditIncidentDate(detail.incident_date || "");
      setEditStatus(detail.status);
      setEditEvidenceIds(detail.linked_evidence.map((e) => e.id));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to retrieve incident details.";
      setDetailError(msg);
    } finally {
      setDetailLoading(false);
    }
  };

  // Close Incident Detail
  const handleCloseDetail = () => {
    setSelectedIncidentId(null);
    setIncidentDetail(null);
    setIsEditing(false);
  };

  // Submit Edit Incident
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIncidentId) return;
    if (!editTitle.trim()) {
      setEditError("Incident title cannot be blank.");
      return;
    }

    setEditSubmitting(true);
    setEditError(null);

    try {
      const updated = await updateIncident(selectedIncidentId, {
        title: editTitle.trim(),
        description: editDescription.trim() ? editDescription.trim() : null,
        incident_date: editIncidentDate ? editIncidentDate : null,
        status: editStatus,
        evidence_ids: editEvidenceIds,
      });

      setIncidentDetail(updated);
      setIsEditing(false);
      await fetchIncidents();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update incident.";
      setEditError(msg);
    } finally {
      setEditSubmitting(false);
    }
  };

  // Handle Delete Confirmation Dialog
  const handleConfirmDelete = async () => {
    if (!deleteTargetIncident) return;
    setDeleteSubmitting(true);
    setDeleteError(null);

    try {
      await deleteIncident(deleteTargetIncident.id);
      setDeleteTargetIncident(null);
      if (selectedIncidentId === deleteTargetIncident.id) {
        handleCloseDetail();
      }
      await fetchIncidents();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete incident.";
      setDeleteError(msg);
    } finally {
      setDeleteSubmitting(false);
    }
  };

  // Search handler
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAppliedSearch(searchTerm.trim());
    setOffset(0);
  };

  // Helper for status badge variant
  const getStatusBadge = (status: IncidentStatus) => {
    switch (status) {
      case "open":
        return <StatusBadge status="warning" label="Open Case" />;
      case "documented":
        return <StatusBadge status="info" label="Documented" />;
      case "resolved":
        return <StatusBadge status="success" label="Resolved" />;
      default:
        return <StatusBadge status="neutral" label={status} />;
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
      {/* Page Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: "var(--space-4)",
        }}
      >
        <div>
          <h1
            style={{
              margin: "0 0 var(--space-1) 0",
              fontSize: "var(--font-size-2xl)",
              fontWeight: 600,
              color: "var(--color-text)",
            }}
          >
            Incident Tracker
          </h1>
          <p
            style={{
              margin: 0,
              color: "var(--color-text-muted)",
              fontSize: "var(--font-size-base)",
              maxWidth: "680px",
            }}
          >
            Document blackmail threats, log chronological case milestones, link forensic evidence items, and organize case records securely.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={handleOpenCreateModal}
          aria-label="Document New Incident"
        >
          + Document New Incident
        </Button>
      </div>

      {/* Global Error Alert */}
      {error && (
        <Alert type="error" title="Incident Tracker Error">
          {error}
        </Alert>
      )}

      {/* Toolbar: Search & Status Filters */}
      <div
        style={{
          display: "flex",
          gap: "var(--space-3)",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: "var(--color-surface)",
          padding: "var(--space-4)",
          borderRadius: "var(--radius-md)",
          border: "1px solid var(--color-border)",
        }}
      >
        <form
          onSubmit={handleSearchSubmit}
          style={{ display: "flex", gap: "var(--space-2)", flex: "1 1 280px" }}
        >
          <input
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search incident title or description..."
            aria-label="Search incident records"
            style={{
              flex: 1,
              padding: "var(--space-2) var(--space-3)",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--color-border)",
              fontSize: "var(--font-size-sm)",
              backgroundColor: "var(--color-background)",
              color: "var(--color-text)",
            }}
          />
          <Button variant="secondary" type="submit" aria-label="Submit search">
            Search
          </Button>
          {appliedSearch && (
            <Button
              variant="secondary"
              type="button"
              onClick={() => {
                setSearchTerm("");
                setAppliedSearch("");
                setOffset(0);
              }}
              aria-label="Clear search"
            >
              Clear
            </Button>
          )}
        </form>

        {/* Status Filter Buttons */}
        <div style={{ display: "flex", gap: "var(--space-2)", alignItems: "center" }}>
          <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)" }}>
            Status:
          </span>
          <Button
            variant={statusFilter === "all" ? "primary" : "secondary"}
            onClick={() => {
              setStatusFilter("all");
              setOffset(0);
            }}
            style={{ padding: "var(--space-1) var(--space-3)", fontSize: "var(--font-size-xs)" }}
            aria-label="Filter all incidents"
          >
            All ({total})
          </Button>
          <Button
            variant={statusFilter === "open" ? "primary" : "secondary"}
            onClick={() => {
              setStatusFilter("open");
              setOffset(0);
            }}
            style={{ padding: "var(--space-1) var(--space-3)", fontSize: "var(--font-size-xs)" }}
            aria-label="Filter open incidents"
          >
            Open
          </Button>
          <Button
            variant={statusFilter === "documented" ? "primary" : "secondary"}
            onClick={() => {
              setStatusFilter("documented");
              setOffset(0);
            }}
            style={{ padding: "var(--space-1) var(--space-3)", fontSize: "var(--font-size-xs)" }}
            aria-label="Filter documented incidents"
          >
            Documented
          </Button>
          <Button
            variant={statusFilter === "resolved" ? "primary" : "secondary"}
            onClick={() => {
              setStatusFilter("resolved");
              setOffset(0);
            }}
            style={{ padding: "var(--space-1) var(--space-3)", fontSize: "var(--font-size-xs)" }}
            aria-label="Filter resolved incidents"
          >
            Resolved
          </Button>
        </div>
      </div>

      {/* Incident Detail Drawer / Card */}
      {selectedIncidentId && (
        <Card
          title={incidentDetail ? incidentDetail.title : "Loading Incident Details..."}
          subtitle={incidentDetail ? `ID: ${incidentDetail.id}` : undefined}
          headerAction={
            <div style={{ display: "flex", gap: "var(--space-2)" }}>
              {!isEditing && incidentDetail && (
                <Button
                  variant="secondary"
                  onClick={() => {
                    fetchVaultEvidence();
                    setIsEditing(true);
                  }}
                  aria-label="Edit Incident"
                >
                  Edit Incident
                </Button>
              )}
              <Button
                variant="secondary"
                onClick={handleCloseDetail}
                aria-label="Close Incident Details"
              >
                Close
              </Button>
            </div>
          }
        >
          {detailLoading && (
            <div style={{ padding: "var(--space-6)", textAlign: "center", color: "var(--color-text-muted)" }}>
              Loading incident details...
            </div>
          )}

          {detailError && (
            <Alert type="error" title="Failed to Load Incident Details">
              {detailError}
            </Alert>
          )}

          {incidentDetail && !detailLoading && (
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
              {/* Status & Timestamps Summary Bar */}
              <div
                style={{
                  display: "flex",
                  gap: "var(--space-3)",
                  flexWrap: "wrap",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingBottom: "var(--space-3)",
                  borderBottom: "1px solid var(--color-border)",
                }}
              >
                <div style={{ display: "flex", gap: "var(--space-2)", alignItems: "center" }}>
                  {getStatusBadge(incidentDetail.status)}
                  <span
                    style={{
                      fontSize: "var(--font-size-xs)",
                      color: "var(--color-text-muted)",
                      padding: "2px 8px",
                      backgroundColor: "var(--color-surface-muted)",
                      borderRadius: "var(--radius-pill)",
                    }}
                  >
                    {incidentDetail.evidence_count} Evidence Item{incidentDetail.evidence_count === 1 ? "" : "s"} Attached
                  </span>
                </div>
                <div style={{ display: "flex", gap: "var(--space-4)", fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)" }}>
                  <span>Created: {formatTimestamp(incidentDetail.created_at)}</span>
                  <span>Updated: {formatTimestamp(incidentDetail.updated_at)}</span>
                </div>
              </div>

              {/* View Mode */}
              {!isEditing ? (
                <>
                  {/* Reported Date & Notes */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                      gap: "var(--space-4)",
                    }}
                  >
                    <div
                      style={{
                        padding: "var(--space-4)",
                        backgroundColor: "var(--color-surface-muted)",
                        borderRadius: "var(--radius-md)",
                      }}
                    >
                      <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)", display: "block", marginBottom: "var(--space-1)" }}>
                        User-Reported Occurrence Date
                      </span>
                      <strong style={{ fontSize: "var(--font-size-base)", color: "var(--color-text)" }}>
                        {incidentDetail.incident_date ? incidentDetail.incident_date : "Not specified"}
                      </strong>
                      <span style={{ display: "block", marginTop: "var(--space-1)", fontSize: "11px", color: "var(--color-text-muted)" }}>
                        Reported by user as event date; distinct from database creation time.
                      </span>
                    </div>

                    <div
                      style={{
                        padding: "var(--space-4)",
                        backgroundColor: "var(--color-surface-muted)",
                        borderRadius: "var(--radius-md)",
                      }}
                    >
                      <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)", display: "block", marginBottom: "var(--space-1)" }}>
                        Incident UUID
                      </span>
                      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                        <code style={{ fontSize: "var(--font-size-xs)" }}>{incidentDetail.id}</code>
                        <Button
                          variant="secondary"
                          style={{ padding: "2px 8px", fontSize: "var(--font-size-xs)" }}
                          onClick={() => handleCopy(incidentDetail.id, `inc-${incidentDetail.id}`)}
                          aria-label="Copy Incident UUID"
                        >
                          {copiedKey === `inc-${incidentDetail.id}` ? "Copied" : "Copy"}
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Description / Case Notes */}
                  {incidentDetail.description ? (
                    <div
                      style={{
                        padding: "var(--space-4)",
                        backgroundColor: "var(--color-surface)",
                        borderRadius: "var(--radius-md)",
                        border: "1px solid var(--color-border)",
                      }}
                    >
                      <h4 style={{ margin: "0 0 var(--space-2) 0", fontSize: "var(--font-size-sm)", color: "var(--color-text-muted)" }}>
                        Case Description &amp; Notes
                      </h4>
                      <p style={{ margin: 0, fontSize: "var(--font-size-sm)", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                        {incidentDetail.description}
                      </p>
                    </div>
                  ) : (
                    <div style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-muted)", fontStyle: "italic" }}>
                      No case notes or descriptions recorded yet.
                    </div>
                  )}

                  {/* Chronological Case Milestones (Timeline) */}
                  <div
                    style={{
                      border: "1px solid var(--color-border)",
                      borderRadius: "var(--radius-md)",
                      padding: "var(--space-4)",
                    }}
                  >
                    <h3 style={{ margin: "0 0 var(--space-1) 0", fontSize: "var(--font-size-base)", fontWeight: 600 }}>
                      Chronological Case Milestones
                    </h3>
                    <p style={{ margin: "0 0 var(--space-4) 0", fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)" }}>
                      Accurately reflects recorded event dates, database intake timestamps, and evidence attachment events without inventing unverified facts.
                    </p>

                    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
                      {/* Milestone 1: Reported Date */}
                      <div style={{ display: "flex", gap: "var(--space-3)", alignItems: "flex-start" }}>
                        <div
                          style={{
                            width: "28px",
                            height: "28px",
                            borderRadius: "50%",
                            backgroundColor: "var(--color-brand-soft)",
                            border: "2px solid var(--color-brand)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "var(--font-size-xs)",
                            fontWeight: 700,
                            color: "var(--color-brand)",
                          }}
                        >
                          1
                        </div>
                        <div style={{ flex: 1 }}>
                          <strong style={{ fontSize: "var(--font-size-sm)", display: "block" }}>
                            Reported Occurrence Date
                          </strong>
                          <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text)" }}>
                            {incidentDetail.incident_date ? incidentDetail.incident_date : "No occurrence date specified"}
                          </span>
                          <span style={{ display: "block", fontSize: "11px", color: "var(--color-text-muted)" }}>
                            User-reported date the event allegedly occurred.
                          </span>
                        </div>
                      </div>

                      {/* Milestone 2: Created at in Haven */}
                      <div style={{ display: "flex", gap: "var(--space-3)", alignItems: "flex-start" }}>
                        <div
                          style={{
                            width: "28px",
                            height: "28px",
                            borderRadius: "50%",
                            backgroundColor: "var(--color-info-soft)",
                            border: "2px solid var(--color-info)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "var(--font-size-xs)",
                            fontWeight: 700,
                            color: "var(--color-info)",
                          }}
                        >
                          2
                        </div>
                        <div style={{ flex: 1 }}>
                          <strong style={{ fontSize: "var(--font-size-sm)", display: "block" }}>
                            Documented in Haven Workspace
                          </strong>
                          <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text)" }}>
                            {formatTimestamp(incidentDetail.created_at)}
                          </span>
                          <span style={{ display: "block", fontSize: "11px", color: "var(--color-text-muted)" }}>
                            System-recorded UTC timestamp when this case record was persisted.
                          </span>
                        </div>
                      </div>

                      {/* Milestone 3: Linked Evidence Items */}
                      {incidentDetail.linked_evidence.map((ev, idx) => (
                        <div key={ev.id} style={{ display: "flex", gap: "var(--space-3)", alignItems: "flex-start" }}>
                          <div
                            style={{
                              width: "28px",
                              height: "28px",
                              borderRadius: "50%",
                              backgroundColor: "var(--color-success-soft)",
                              border: "2px solid var(--color-success)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "var(--font-size-xs)",
                              fontWeight: 700,
                              color: "var(--color-success)",
                            }}
                          >
                            {3 + idx}
                          </div>
                          <div style={{ flex: 1 }}>
                            <strong style={{ fontSize: "var(--font-size-sm)", display: "block" }}>
                              Evidence Linked: {ev.original_filename}
                            </strong>
                            <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text)" }}>
                              Linked: {formatTimestamp(ev.linked_at)}
                            </span>
                            <span style={{ display: "block", fontSize: "11px", color: "var(--color-text-muted)" }}>
                              Intake SHA-256: <code>{truncateHash(ev.sha256)}</code> ({formatBytes(ev.file_size_bytes)})
                            </span>
                          </div>
                        </div>
                      ))}

                      {/* Milestone 4: Updated At */}
                      <div style={{ display: "flex", gap: "var(--space-3)", alignItems: "flex-start" }}>
                        <div
                          style={{
                            width: "28px",
                            height: "28px",
                            borderRadius: "50%",
                            backgroundColor: "var(--color-surface-muted)",
                            border: "2px solid var(--color-border)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "var(--font-size-xs)",
                            fontWeight: 700,
                            color: "var(--color-text-muted)",
                          }}
                        >
                          {3 + incidentDetail.linked_evidence.length}
                        </div>
                        <div style={{ flex: 1 }}>
                          <strong style={{ fontSize: "var(--font-size-sm)", display: "block" }}>
                            Last Case Update
                          </strong>
                          <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text)" }}>
                            {formatTimestamp(incidentDetail.updated_at)}
                          </span>
                          <span style={{ display: "block", fontSize: "11px", color: "var(--color-text-muted)" }}>
                            System-recorded UTC timestamp of the most recent modification.
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Attached Evidence List */}
                  <div
                    style={{
                      border: "1px solid var(--color-border)",
                      borderRadius: "var(--radius-md)",
                      padding: "var(--space-4)",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-3)" }}>
                      <h3 style={{ margin: 0, fontSize: "var(--font-size-base)", fontWeight: 600 }}>
                        Attached Forensic Evidence ({incidentDetail.linked_evidence.length})
                      </h3>
                      {onNavigateToVault && (
                        <Button
                          variant="secondary"
                          onClick={() => onNavigateToVault()}
                          style={{ fontSize: "var(--font-size-xs)", padding: "var(--space-1) var(--space-3)" }}
                          aria-label="Browse Evidence Vault"
                        >
                          Browse Vault
                        </Button>
                      )}
                    </div>

                    {incidentDetail.linked_evidence.length === 0 ? (
                      <p style={{ margin: 0, fontSize: "var(--font-size-sm)", color: "var(--color-text-muted)" }}>
                        No evidence items are currently linked to this incident. Click "Edit Incident" to link items preserved in the vault.
                      </p>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                        {incidentDetail.linked_evidence.map((ev) => (
                          <div
                            key={ev.id}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              padding: "var(--space-3)",
                              backgroundColor: "var(--color-surface-muted)",
                              borderRadius: "var(--radius-sm)",
                              border: "1px solid var(--color-border)",
                              flexWrap: "wrap",
                              gap: "var(--space-2)",
                            }}
                          >
                            <div>
                              <strong style={{ fontSize: "var(--font-size-sm)", display: "block" }}>
                                {ev.original_filename}
                              </strong>
                              <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)" }}>
                                {ev.mime_type_detected} • {formatBytes(ev.file_size_bytes)} • SHA-256:{" "}
                                <code>{truncateHash(ev.sha256)}</code>
                              </span>
                            </div>

                            <div style={{ display: "flex", gap: "var(--space-2)", alignItems: "center" }}>
                              <StatusBadge
                                status={ev.file_exists ? "success" : "danger"}
                                label={ev.file_exists ? "Preserved" : "Storage Missing"}
                              />
                              {onNavigateToVault && (
                                <Button
                                  variant="secondary"
                                  onClick={() => onNavigateToVault(ev.id)}
                                  style={{ padding: "2px 8px", fontSize: "var(--font-size-xs)" }}
                                  aria-label={`View ${ev.original_filename} in Vault`}
                                >
                                  View in Vault
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Danger Zone: Delete Incident Action */}
                  <div
                    style={{
                      borderTop: "1px solid var(--color-border)",
                      paddingTop: "var(--space-4)",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: "var(--space-2)",
                    }}
                  >
                    <div>
                      <strong style={{ fontSize: "var(--font-size-sm)", color: "var(--color-danger)" }}>
                        Delete this incident record
                      </strong>
                      <span style={{ display: "block", fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)" }}>
                        Removes the incident and association links. Preserved evidence files in the vault will NOT be deleted.
                      </span>
                    </div>
                    <Button
                      variant="danger"
                      onClick={() => setDeleteTargetIncident(incidentDetail)}
                      aria-label="Delete Incident"
                    >
                      Delete Incident
                    </Button>
                  </div>
                </>
              ) : (
                /* Edit Mode Form */
                <form onSubmit={handleEditSubmit} style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
                  {editError && (
                    <Alert type="error" title="Update Error">
                      {editError}
                    </Alert>
                  )}

                  <div>
                    <label
                      htmlFor="edit-incident-title"
                      style={{ display: "block", fontSize: "var(--font-size-sm)", fontWeight: 600, marginBottom: "var(--space-1)" }}
                    >
                      Incident Title <span style={{ color: "var(--color-danger)" }}>*</span>
                    </label>
                    <input
                      id="edit-incident-title"
                      type="text"
                      required
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "var(--space-2) var(--space-3)",
                        borderRadius: "var(--radius-sm)",
                        border: "1px solid var(--color-border)",
                        fontSize: "var(--font-size-sm)",
                        backgroundColor: "var(--color-background)",
                        color: "var(--color-text)",
                      }}
                    />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)" }}>
                    <div>
                      <label
                        htmlFor="edit-incident-status"
                        style={{ display: "block", fontSize: "var(--font-size-sm)", fontWeight: 600, marginBottom: "var(--space-1)" }}
                      >
                        Status
                      </label>
                      <select
                        id="edit-incident-status"
                        value={editStatus}
                        onChange={(e) => setEditStatus(e.target.value as IncidentStatus)}
                        style={{
                          width: "100%",
                          padding: "var(--space-2) var(--space-3)",
                          borderRadius: "var(--radius-sm)",
                          border: "1px solid var(--color-border)",
                          fontSize: "var(--font-size-sm)",
                          backgroundColor: "var(--color-background)",
                          color: "var(--color-text)",
                        }}
                      >
                        <option value="open">Open</option>
                        <option value="documented">Documented</option>
                        <option value="resolved">Resolved</option>
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor="edit-incident-date"
                        style={{ display: "block", fontSize: "var(--font-size-sm)", fontWeight: 600, marginBottom: "var(--space-1)" }}
                      >
                        Reported Occurrence Date
                      </label>
                      <input
                        id="edit-incident-date"
                        type="text"
                        placeholder="YYYY-MM-DD (e.g. 2026-10-15)"
                        value={editIncidentDate}
                        onChange={(e) => setEditIncidentDate(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "var(--space-2) var(--space-3)",
                          borderRadius: "var(--radius-sm)",
                          border: "1px solid var(--color-border)",
                          fontSize: "var(--font-size-sm)",
                          backgroundColor: "var(--color-background)",
                          color: "var(--color-text)",
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="edit-incident-desc"
                      style={{ display: "block", fontSize: "var(--font-size-sm)", fontWeight: 600, marginBottom: "var(--space-1)" }}
                    >
                      Description &amp; Case Notes
                    </label>
                    <textarea
                      id="edit-incident-desc"
                      rows={4}
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      placeholder="Enter details, blackmail threats, demands, or perpetrator information..."
                      style={{
                        width: "100%",
                        padding: "var(--space-2) var(--space-3)",
                        borderRadius: "var(--radius-sm)",
                        border: "1px solid var(--color-border)",
                        fontSize: "var(--font-size-sm)",
                        backgroundColor: "var(--color-background)",
                        color: "var(--color-text)",
                        fontFamily: "inherit",
                      }}
                    />
                  </div>

                  {/* Evidence Selection Checklist */}
                  <div>
                    <label style={{ display: "block", fontSize: "var(--font-size-sm)", fontWeight: 600, marginBottom: "var(--space-1)" }}>
                      Link Evidence from Vault ({editEvidenceIds.length} selected)
                    </label>
                    {loadingEvidence ? (
                      <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)" }}>Loading evidence options...</div>
                    ) : vaultEvidence.length === 0 ? (
                      <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)" }}>No evidence available in vault.</div>
                    ) : (
                      <div
                        style={{
                          maxHeight: "180px",
                          overflowY: "auto",
                          border: "1px solid var(--color-border)",
                          borderRadius: "var(--radius-sm)",
                          padding: "var(--space-2)",
                          display: "flex",
                          flexDirection: "column",
                          gap: "var(--space-1)",
                        }}
                      >
                        {vaultEvidence.map((ev) => {
                          const isChecked = editEvidenceIds.includes(ev.id);
                          return (
                            <label
                              key={ev.id}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "var(--space-2)",
                                padding: "var(--space-1) var(--space-2)",
                                borderRadius: "var(--radius-sm)",
                                backgroundColor: isChecked ? "var(--color-brand-soft)" : "transparent",
                                cursor: "pointer",
                                fontSize: "var(--font-size-xs)",
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setEditEvidenceIds([...editEvidenceIds, ev.id]);
                                  } else {
                                    setEditEvidenceIds(editEvidenceIds.filter((id) => id !== ev.id));
                                  }
                                }}
                              />
                              <span style={{ fontWeight: 600 }}>{ev.original_filename}</span>
                              <span style={{ color: "var(--color-text-muted)", marginLeft: "auto" }}>
                                {formatBytes(ev.file_size_bytes)} • {truncateHash(ev.sha256)}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div style={{ display: "flex", gap: "var(--space-2)", justifyContent: "flex-end", marginTop: "var(--space-2)" }}>
                    <Button
                      variant="secondary"
                      type="button"
                      onClick={() => setIsEditing(false)}
                      disabled={editSubmitting}
                      aria-label="Cancel Editing"
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      type="submit"
                      loading={editSubmitting}
                      aria-label="Save Changes"
                    >
                      Save Changes
                    </Button>
                  </div>
                </form>
              )}
            </div>
          )}
        </Card>
      )}

      {/* Main Incidents List Card */}
      <Card
        title="Documented Incidents"
        subtitle={
          loading
            ? "Loading incident records..."
            : `Showing ${incidents.length} of ${total} total incident record${total === 1 ? "" : "s"}`
        }
      >
        {loading && (
          <div style={{ padding: "var(--space-8)", textAlign: "center", color: "var(--color-text-muted)" }}>
            Loading incident records...
          </div>
        )}

        {!loading && incidents.length === 0 && (
          <div
            style={{
              padding: "var(--space-8)",
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "var(--space-3)",
            }}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                backgroundColor: "var(--color-surface-muted)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "24px",
                color: "var(--color-text-muted)",
              }}
              aria-hidden="true"
            >
              📋
            </div>
            <strong style={{ fontSize: "var(--font-size-base)", color: "var(--color-text)" }}>
              No Incidents Documented Yet
            </strong>
            <p style={{ margin: 0, fontSize: "var(--font-size-sm)", color: "var(--color-text-muted)", maxWidth: "420px" }}>
              {appliedSearch || statusFilter !== "all"
                ? "No incidents matched your search or status filter. Try clearing filters."
                : "Create your first incident record to organize threats, attach preserved evidence, and track safety actions."}
            </p>
            <Button
              variant="primary"
              onClick={handleOpenCreateModal}
              aria-label="Document First Incident"
            >
              + Document First Incident
            </Button>
          </div>
        )}

        {!loading && incidents.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
            {incidents.map((incident) => (
              <div
                key={incident.id}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "var(--space-3)",
                  padding: "var(--space-4)",
                  backgroundColor: "var(--color-surface)",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--color-border)",
                  transition: "border-color var(--transition-fast)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    flexWrap: "wrap",
                    gap: "var(--space-2)",
                  }}
                >
                  <div style={{ flex: 1, minWidth: "240px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginBottom: "var(--space-1)" }}>
                      <strong style={{ fontSize: "var(--font-size-base)", color: "var(--color-text)" }}>
                        {incident.title}
                      </strong>
                      {getStatusBadge(incident.status)}
                    </div>
                    {incident.description && (
                      <p
                        style={{
                          margin: 0,
                          fontSize: "var(--font-size-sm)",
                          color: "var(--color-text-secondary)",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {incident.description}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", gap: "var(--space-2)", alignItems: "center" }}>
                    <Button
                      variant="primary"
                      onClick={() => handleOpenDetail(incident.id)}
                      aria-label={`View details of ${incident.title}`}
                    >
                      View &amp; Edit Details
                    </Button>
                    <Button
                      variant="danger"
                      onClick={() => setDeleteTargetIncident(incident)}
                      aria-label={`Delete ${incident.title}`}
                    >
                      Delete
                    </Button>
                  </div>
                </div>

                {/* Metadata Row */}
                <div
                  style={{
                    display: "flex",
                    gap: "var(--space-4)",
                    flexWrap: "wrap",
                    alignItems: "center",
                    fontSize: "var(--font-size-xs)",
                    color: "var(--color-text-muted)",
                    borderTop: "1px solid var(--color-border)",
                    paddingTop: "var(--space-2)",
                  }}
                >
                  <span>
                    Reported Date: <strong>{incident.incident_date ? incident.incident_date : "Unspecified"}</strong>
                  </span>
                  <span>
                    Evidence: <strong>{incident.evidence_count} item{incident.evidence_count === 1 ? "" : "s"}</strong>
                  </span>
                  <span style={{ marginLeft: "auto" }}>
                    Last Updated: {formatTimestamp(incident.updated_at)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Create Incident Modal */}
      {showCreateModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-incident-title"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "var(--space-4)",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: "var(--color-surface)",
              borderRadius: "var(--radius-lg)",
              maxWidth: "600px",
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: "var(--space-6)",
              boxShadow: "var(--shadow-lg)",
              display: "flex",
              flexDirection: "column",
              gap: "var(--space-4)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 id="create-incident-title" style={{ margin: 0, fontSize: "var(--font-size-lg)", fontWeight: 600 }}>
                Document New Incident
              </h2>
              <Button
                variant="secondary"
                onClick={() => setShowCreateModal(false)}
                aria-label="Close modal"
              >
                ✕
              </Button>
            </div>

            {createError && (
              <Alert type="error" title="Validation Error">
                {createError}
              </Alert>
            )}

            <form onSubmit={handleCreateSubmit} style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
              <div>
                <label
                  htmlFor="new-incident-title"
                  style={{ display: "block", fontSize: "var(--font-size-sm)", fontWeight: 600, marginBottom: "var(--space-1)" }}
                >
                  Incident Title <span style={{ color: "var(--color-danger)" }}>*</span>
                </label>
                <input
                  id="new-incident-title"
                  type="text"
                  required
                  placeholder="e.g. Demands received via messaging app"
                  value={createTitle}
                  onChange={(e) => setCreateTitle(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "var(--space-2) var(--space-3)",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--color-border)",
                    fontSize: "var(--font-size-sm)",
                    backgroundColor: "var(--color-background)",
                    color: "var(--color-text)",
                  }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)" }}>
                <div>
                  <label
                    htmlFor="new-incident-status"
                    style={{ display: "block", fontSize: "var(--font-size-sm)", fontWeight: 600, marginBottom: "var(--space-1)" }}
                  >
                    Tracking Status
                  </label>
                  <select
                    id="new-incident-status"
                    value={createStatus}
                    onChange={(e) => setCreateStatus(e.target.value as IncidentStatus)}
                    style={{
                      width: "100%",
                      padding: "var(--space-2) var(--space-3)",
                      borderRadius: "var(--radius-sm)",
                      border: "1px solid var(--color-border)",
                      fontSize: "var(--font-size-sm)",
                      backgroundColor: "var(--color-background)",
                      color: "var(--color-text)",
                    }}
                  >
                    <option value="open">Open</option>
                    <option value="documented">Documented</option>
                    <option value="resolved">Resolved</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="new-incident-date"
                    style={{ display: "block", fontSize: "var(--font-size-sm)", fontWeight: 600, marginBottom: "var(--space-1)" }}
                  >
                    Reported Date of Occurrence
                  </label>
                  <input
                    id="new-incident-date"
                    type="text"
                    placeholder="YYYY-MM-DD (e.g. 2026-10-15)"
                    value={createIncidentDate}
                    onChange={(e) => setCreateIncidentDate(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "var(--space-2) var(--space-3)",
                      borderRadius: "var(--radius-sm)",
                      border: "1px solid var(--color-border)",
                      fontSize: "var(--font-size-sm)",
                      backgroundColor: "var(--color-background)",
                      color: "var(--color-text)",
                    }}
                  />
                  <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>
                    Optional reported date the threat occurred.
                  </span>
                </div>
              </div>

              <div>
                <label
                  htmlFor="new-incident-desc"
                  style={{ display: "block", fontSize: "var(--font-size-sm)", fontWeight: 600, marginBottom: "var(--space-1)" }}
                >
                  Description &amp; Case Notes (Optional)
                </label>
                <textarea
                  id="new-incident-desc"
                  rows={4}
                  value={createDescription}
                  onChange={(e) => setCreateDescription(e.target.value)}
                  placeholder="Record threats, communication channels, sender identifiers, or safety considerations..."
                  style={{
                    width: "100%",
                    padding: "var(--space-2) var(--space-3)",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--color-border)",
                    fontSize: "var(--font-size-sm)",
                    backgroundColor: "var(--color-background)",
                    color: "var(--color-text)",
                    fontFamily: "inherit",
                  }}
                />
              </div>

              {/* Evidence Multi-Select */}
              <div>
                <label style={{ display: "block", fontSize: "var(--font-size-sm)", fontWeight: 600, marginBottom: "var(--space-1)" }}>
                  Attach Evidence from Vault ({createEvidenceIds.length} selected)
                </label>
                {loadingEvidence ? (
                  <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)" }}>Loading evidence options...</div>
                ) : vaultEvidence.length === 0 ? (
                  <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)" }}>
                    No evidence records preserved in the vault yet. You can attach evidence later.
                  </div>
                ) : (
                  <div
                    style={{
                      maxHeight: "160px",
                      overflowY: "auto",
                      border: "1px solid var(--color-border)",
                      borderRadius: "var(--radius-sm)",
                      padding: "var(--space-2)",
                      display: "flex",
                      flexDirection: "column",
                      gap: "var(--space-1)",
                    }}
                  >
                    {vaultEvidence.map((ev) => {
                      const isChecked = createEvidenceIds.includes(ev.id);
                      return (
                        <label
                          key={ev.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "var(--space-2)",
                            padding: "var(--space-1) var(--space-2)",
                            borderRadius: "var(--radius-sm)",
                            backgroundColor: isChecked ? "var(--color-brand-soft)" : "transparent",
                            cursor: "pointer",
                            fontSize: "var(--font-size-xs)",
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setCreateEvidenceIds([...createEvidenceIds, ev.id]);
                              } else {
                                setCreateEvidenceIds(createEvidenceIds.filter((id) => id !== ev.id));
                              }
                            }}
                          />
                          <span style={{ fontWeight: 600 }}>{ev.original_filename}</span>
                          <span style={{ color: "var(--color-text-muted)", marginLeft: "auto" }}>
                            {formatBytes(ev.file_size_bytes)} • {truncateHash(ev.sha256)}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              <div style={{ display: "flex", gap: "var(--space-2)", justifyContent: "flex-end", marginTop: "var(--space-2)" }}>
                <Button
                  variant="secondary"
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  disabled={createSubmitting}
                  aria-label="Cancel creation"
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  type="submit"
                  loading={createSubmitting}
                  aria-label="Document Incident"
                >
                  Document Incident
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTargetIncident && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-confirmation-title"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "var(--space-4)",
            zIndex: 1100,
          }}
        >
          <div
            style={{
              backgroundColor: "var(--color-surface)",
              borderRadius: "var(--radius-lg)",
              maxWidth: "480px",
              width: "100%",
              padding: "var(--space-6)",
              boxShadow: "var(--shadow-lg)",
              display: "flex",
              flexDirection: "column",
              gap: "var(--space-4)",
            }}
          >
            <h2 id="delete-confirmation-title" style={{ margin: 0, fontSize: "var(--font-size-lg)", color: "var(--color-danger)" }}>
              Delete Incident Record?
            </h2>

            {deleteError && (
              <Alert type="error" title="Deletion Failed">
                {deleteError}
              </Alert>
            )}

            <p style={{ margin: 0, fontSize: "var(--font-size-sm)", lineHeight: 1.5 }}>
              Are you sure you want to delete <strong>"{deleteTargetIncident.title}"</strong>?
            </p>

            <div
              style={{
                padding: "var(--space-3)",
                backgroundColor: "var(--color-surface-muted)",
                borderRadius: "var(--radius-sm)",
                borderLeft: "4px solid var(--color-success)",
                fontSize: "var(--font-size-xs)",
                color: "var(--color-text)",
              }}
            >
              <strong>Evidence Safety Guarantee:</strong>
              <p style={{ margin: "var(--space-1) 0 0 0" }}>
                Preserved evidence files and their SHA-256 records will remain completely intact in the Evidence Vault. Only the incident log and its association links will be deleted.
              </p>
            </div>

            <div style={{ display: "flex", gap: "var(--space-2)", justifyContent: "flex-end", marginTop: "var(--space-2)" }}>
              <Button
                variant="secondary"
                onClick={() => setDeleteTargetIncident(null)}
                disabled={deleteSubmitting}
                aria-label="Cancel deletion"
              >
                Keep Incident
              </Button>
              <Button
                variant="danger"
                onClick={handleConfirmDelete}
                loading={deleteSubmitting}
                aria-label="Confirm Delete Incident"
              >
                Delete Incident Record
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
