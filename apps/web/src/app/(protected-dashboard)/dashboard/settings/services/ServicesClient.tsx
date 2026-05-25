"use client";

import {
  type CreateServiceInput,
  type UpdateServiceInput
} from "@radevu/shared";
import { Briefcase, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { EmptyState } from "@/components/EmptyState";
import { Modal } from "@/components/Modal";
import {
  ServiceCard,
  type ServiceCardService
} from "@/components/ServiceCard";
import { ServiceForm } from "@/components/ServiceForm";

type ServiceListItem = ServiceCardService & {
  business_id: string;
  created_at: string;
  updated_at: string;
};

type ServicesClientProps = {
  businessId: string;
  initialServices: ServiceListItem[];
};

type ModalState =
  | {
      type: "create";
    }
  | {
      service: ServiceListItem;
      type: "edit";
    }
  | null;

type DeleteState = {
  service: ServiceListItem;
} | null;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isService(value: unknown): value is ServiceListItem {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.business_id === "string" &&
    typeof value.name === "string" &&
    typeof value.duration_minutes === "number" &&
    typeof value.price_cents === "number" &&
    typeof value.currency === "string" &&
    (typeof value.description === "string" || value.description === null) &&
    typeof value.active === "boolean" &&
    typeof value.created_at === "string" &&
    typeof value.updated_at === "string"
  );
}

async function readService(response: Response): Promise<ServiceListItem> {
  let payload: unknown;

  try {
    payload = await response.json();
  } catch (error) {
    console.error("Failed to parse service API response", {
      status: response.status,
      error
    });
    throw new Error("Invalid service API response.");
  }

  if (!isRecord(payload) || !isService(payload.service)) {
    console.error("Service API response had an unexpected shape", {
      payload
    });
    throw new Error("Invalid service API response.");
  }

  return payload.service;
}

async function readErrorText(response: Response): Promise<string> {
  try {
    const payload: unknown = await response.json();
    if (
      isRecord(payload) &&
      isRecord(payload.error) &&
      typeof payload.error.message === "string"
    ) {
      return payload.error.message;
    }
  } catch (error) {
    console.error("Failed to parse service API error response", {
      status: response.status,
      error
    });
  }

  return "Η ενέργεια απέτυχε.";
}

/**
 * Manages the owner service catalog CRUD interface.
 *
 * @param props - Business id and initial server-rendered service list.
 * @returns A client-side services management view.
 */
export function ServicesClient({
  businessId,
  initialServices
}: ServicesClientProps): JSX.Element {
  const router = useRouter();
  const [services, setServices] = useState(initialServices);
  const [modalState, setModalState] = useState<ModalState>(null);
  const [deleteState, setDeleteState] = useState<DeleteState>(null);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);

  async function createService(input: CreateServiceInput): Promise<void> {
    setPendingAction("create");
    setPageError(null);

    try {
      const response = await fetch(`/api/v1/businesses/${businessId}/services`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(input)
      });

      if (!response.ok) {
        throw new Error(await readErrorText(response));
      }

      const service = await readService(response);
      setServices((currentServices) => [...currentServices, service]);
      setModalState(null);
      router.refresh();
    } catch (error) {
      console.error("Failed to create service from dashboard", {
        businessId,
        error
      });
      setPageError(
        error instanceof Error ? error.message : "Η δημιουργία απέτυχε."
      );
      throw error;
    } finally {
      setPendingAction(null);
    }
  }

  async function updateService(
    serviceId: string,
    input: UpdateServiceInput
  ): Promise<void> {
    setPendingAction(serviceId);
    setPageError(null);

    try {
      const response = await fetch(`/api/v1/services/${serviceId}`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(input)
      });

      if (!response.ok) {
        throw new Error(await readErrorText(response));
      }

      const service = await readService(response);
      setServices((currentServices) =>
        currentServices.map((currentService) =>
          currentService.id === service.id ? service : currentService
        )
      );
      setModalState(null);
      router.refresh();
    } catch (error) {
      console.error("Failed to update service from dashboard", {
        serviceId,
        error
      });
      setPageError(
        error instanceof Error ? error.message : "Η αποθήκευση απέτυχε."
      );
      throw error;
    } finally {
      setPendingAction(null);
    }
  }

  async function deleteService(serviceId: string): Promise<void> {
    setPendingAction(serviceId);
    setPageError(null);

    try {
      const response = await fetch(`/api/v1/services/${serviceId}`, {
        method: "DELETE",
        credentials: "include"
      });

      if (!response.ok) {
        throw new Error(await readErrorText(response));
      }

      setServices((currentServices) =>
        currentServices.filter((service) => service.id !== serviceId)
      );
      setDeleteState(null);
      router.refresh();
    } catch (error) {
      console.error("Failed to delete service from dashboard", {
        serviceId,
        error
      });
      setPageError(
        error instanceof Error ? error.message : "Η διαγραφή απέτυχε."
      );
      throw error;
    } finally {
      setPendingAction(null);
    }
  }

  return (
    <section className="mx-auto flex max-w-md flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold leading-tight text-slate-900">
          Υπηρεσίες
        </h1>
        <p className="text-base leading-relaxed text-slate-500">
          Κράτα καθαρή λίστα με διάρκεια, τιμή και ενεργή κατάσταση.
        </p>
      </div>

      {pageError ? <p className="text-sm text-red-500">{pageError}</p> : null}

      {services.length === 0 ? (
        <EmptyState
          action={
            <button
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-indigo-500 px-5 py-2.5 font-medium text-white transition-colors hover:bg-indigo-600 active:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              onClick={() => setModalState({ type: "create" })}
              type="button"
            >
              <Plus aria-hidden="true" className="h-5 w-5" />
              Νέα υπηρεσία
            </button>
          }
          description="Πρόσθεσε την πρώτη υπηρεσία που μπορούν να κλείνουν οι πελάτες."
          icon={Briefcase}
          title="Δεν έχεις υπηρεσίες ακόμα"
        />
      ) : (
        <div className="flex flex-col gap-4">
          {services.map((service) => (
            <ServiceCard
              isPending={pendingAction === service.id}
              key={service.id}
              onDelete={() => setDeleteState({ service })}
              onEdit={() =>
                setModalState({
                  type: "edit",
                  service
                })
              }
              onToggleActive={() =>
                updateService(service.id, {
                  active: !service.active
                })
              }
              service={service}
            />
          ))}
        </div>
      )}

      <button
        aria-label="Νέα υπηρεσία"
        className="fixed bottom-24 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-500 text-white shadow-lg transition-colors hover:bg-indigo-600 active:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        onClick={() => setModalState({ type: "create" })}
        type="button"
      >
        <Plus aria-hidden="true" className="h-6 w-6" />
      </button>

      <Modal
        onOpenChange={(open) => {
          if (!open) {
            setModalState(null);
          }
        }}
        open={modalState !== null}
        title={
          modalState?.type === "edit"
            ? "Επεξεργασία υπηρεσίας"
            : "Νέα υπηρεσία"
        }
      >
        {modalState?.type === "edit" ? (
          <ServiceForm
            initialValue={modalState.service}
            isSubmitting={pendingAction === modalState.service.id}
            mode="edit"
            onSubmit={(input) => updateService(modalState.service.id, input)}
            submitLabel="Αποθήκευση"
          />
        ) : (
          <ServiceForm
            isSubmitting={pendingAction === "create"}
            mode="create"
            onSubmit={createService}
            submitLabel="Δημιουργία"
          />
        )}
      </Modal>

      <ConfirmDialog
        body={
          deleteState
            ? `Η υπηρεσία "${deleteState.service.name}" θα αφαιρεθεί από τον κατάλογο.`
            : ""
        }
        isSubmitting={
          deleteState ? pendingAction === deleteState.service.id : false
        }
        onConfirm={() =>
          deleteState ? deleteService(deleteState.service.id) : Promise.resolve()
        }
        onOpenChange={(open) => {
          if (!open) {
            setDeleteState(null);
          }
        }}
        open={deleteState !== null}
        title="Διαγραφή υπηρεσίας"
      />
    </section>
  );
}
