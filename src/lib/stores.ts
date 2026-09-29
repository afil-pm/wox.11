import Store from "@/lib/models/store";

export interface SupplierStoreRef {
  id: string;
  name: string;
}

/**
 * Resolves the store that belongs to a supplier, creating it on first use from
 * the supplier's verified account details. The store record owns the name from
 * then on: `$setOnInsert` never overwrites an existing store, so a later rename
 * of the store record is what every product view reads.
 */
export async function ensureSupplierStore(
  supplierId: string,
  supplierName: string
): Promise<SupplierStoreRef | null> {
  if (!supplierId) return null;
  const name = String(supplierName || "").trim() || "My Store";
  const store = await Store.findOneAndUpdate(
    { supplierId },
    { $setOnInsert: { supplierId, name } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).lean();
  if (!store) return null;
  return { id: String(store._id), name: String(store.name ?? name) };
}

/** Batch variant used when backfilling legacy supplier products. */
export async function ensureSupplierStores(
  suppliers: { supplierId: string; supplierName: string }[]
): Promise<Map<string, SupplierStoreRef>> {
  const result = new Map<string, SupplierStoreRef>();
  for (const supplier of suppliers) {
    if (!supplier.supplierId || result.has(supplier.supplierId)) continue;
    const store = await ensureSupplierStore(supplier.supplierId, supplier.supplierName);
    if (store) result.set(supplier.supplierId, store);
  }
  return result;
}

/** `storeId` -> current store name for a batch of ids (live join). */
export async function loadStoreNames(storeIds: string[]): Promise<Map<string, string>> {
  const ids = [...new Set(storeIds.filter(Boolean))];
  if (ids.length === 0) return new Map();
  const stores = await Store.find({ _id: { $in: ids } }).lean();
  return new Map(stores.map((store) => [String(store._id), String(store.name ?? "")]));
}

/** `supplierId` -> that supplier's single store (id + current name). */
export async function loadStoresBySupplier(
  supplierIds: string[]
): Promise<Map<string, SupplierStoreRef>> {
  const ids = [...new Set(supplierIds.filter(Boolean))];
  if (ids.length === 0) return new Map();
  const stores = await Store.find({ supplierId: { $in: ids } }).lean();
  return new Map(
    stores.map((store) => [
      String(store.supplierId),
      { id: String(store._id), name: String(store.name ?? "") },
    ])
  );
}
