import { useEffect, useState, useMemo } from "react";
import CustomSnackbar from "@presentation/components/CustomSnackbar";
import { Card, CardContent, Typography, Box, IconButton } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { Add as AddIcon, Delete as DeleteIcon, Edit as EditIcon } from "@mui/icons-material";
import DocumentTypeModal from "@presentation/pages/document-type/components/DocumentTypeModal";
import ConfirmDialog from "@presentation/components/ConfirmDialog";
import { CreateDocumentTypeUseCase } from "@application/usecases/document-type/CreateDocumentTypeUseCase";
import { UpdateDocumentTypeUseCase } from "@application/usecases/document-type/UpdateDocumentTypeUseCase";
import { DeleteDocumentTypeUseCase } from "@application/usecases/document-type/DeleteDocumentTypeUseCase";
import { RestDocumentTypeRepository } from "@infrastructure/repositories/RestDocumentTypeRepository";
import { DeleteMultiDocumentTypeUseCase } from "@application/usecases/document-type/DeleteMultiDocumentTypeUseCase";

import useDocumentTypeColumns from "@presentation/pages/document-type/hooks/useDocumentTypeColumns";
import useDocumentTypeData from "@presentation/pages/document-type/hooks/useDocumentTypeData";


// Lấy menuData từ localStorage (userMenu)
function getMenuDataFromStorage() {
  try {
    const raw = localStorage.getItem('userMenu');
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

const repo = new RestDocumentTypeRepository();

export default function DocumentTypePage() {
  // Lấy permissionList cho menu document-type từ localStorage
  const documentTypeMenu = useMemo(() => {
    const menuData = getMenuDataFromStorage();
    return menuData.find(m => m.code === "document-type");
  }, []);
  const permissionList = documentTypeMenu?.permissionList || [];
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [modalOpen, setModalOpen] = useState(false);
  const [modalData, setModalData] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [rowToDelete, setRowToDelete] = useState(null);
  const [selectionModel, setSelectionModel] = useState([]);
  const [confirmMultiOpen, setConfirmMultiOpen] = useState(false);

  const createUseCase = new CreateDocumentTypeUseCase(repo);
  const updateUseCase = new UpdateDocumentTypeUseCase(repo);
  const deleteUseCase = new DeleteDocumentTypeUseCase(repo);
  const deleteMultiUseCase = new DeleteMultiDocumentTypeUseCase(repo);

  const {
    data, total, loading, error,
    paginationModel, setPaginationModel,
    filterModel, setFilterModel,
    sortModel, setSortModel,
    fetchData
  } = useDocumentTypeData();

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const columns = useDocumentTypeColumns({
    onEdit: (row) => { setModalData(row); setModalOpen(true); },
    onDelete: (row) => { setRowToDelete(row); setConfirmOpen(true); },
    permissionList
  });

  return (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Typography variant="h5" gutterBottom>Document Types</Typography>
          <Box>
            {permissionList.includes("Create") && (
              <IconButton color="primary" onClick={() => { setModalData(null); setModalOpen(true); }}>
                <AddIcon />
              </IconButton>
            )}
            {permissionList.includes("Update") && (
              <IconButton
                color="primary"
                onClick={() => {
                  if (selectionModel.length === 1) {
                    const selectedRow = data.find(row => row.id === selectionModel[0]);
                    setModalData(selectedRow);
                    setModalOpen(true);
                  }
                }}
                disabled={selectionModel.length !== 1}
                sx={{ ml: 1 }}
                title={selectionModel.length === 1 ? "Edit Selected" : "Select one row to edit"}
              >
                <EditIcon />
              </IconButton>
            )}
            {permissionList.includes("Delete") && (
              <IconButton
                color="error"
                onClick={() => setConfirmMultiOpen(true)}
                disabled={selectionModel.length === 0}
                sx={{ ml: 1 }}
                title="Delete Selected"
              >
                <DeleteIcon />
              </IconButton>
            )}
          </Box>
        </Box>
        <Box sx={{ height: 520, width: "100%", mt: 2 }}>
          <DataGrid
            rows={data}
            columns={columns}
            rowCount={total}
            pagination
            paginationMode="server"
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            pageSizeOptions={[5, 10, 25, 50, 100]}
            loading={loading}
            sortingMode="server"
            sortModel={sortModel}
            onSortModelChange={(model) => {
              setSortModel(model);
              setPaginationModel((prev) => ({ ...prev, page: 0 }));
            }}
            filterMode="server"
            filterModel={filterModel}
            onFilterModelChange={(model) => {
              const oldItems = filterModel.items || [];
              const newItems = model.items || [];
              const isSame =
                oldItems.length === newItems.length &&
                oldItems.every((item, idx) => {
                  const n = newItems[idx];
                  return (
                    item.columnField === n.columnField &&
                    item.operatorValue === n.operatorValue &&
                    item.value === n.value
                  );
                });
              if (!isSame) {
                setFilterModel(model);
                setPaginationModel((prev) => ({ ...prev, page: 0 }));
              }
            }}
            disableRowSelectionOnClick
            checkboxSelection={permissionList.includes("Delete")}
            selectionModel={selectionModel}
            onRowSelectionModelChange={(newSelection) => setSelectionModel(newSelection)}
            getRowId={(row) => row.id}
            localeText={{
              noRowsLabel: "No data",
              toolbarColumns: "Columns",
              toolbarFilters: "Filter",
              toolbarExport: "Export",
            }}
          />
        </Box>
        {error && <Typography color="error">{error}</Typography>}

        <DocumentTypeModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          initialData={modalData}
          loading={loading}
          onSubmit={async (formData) => {
            try {
              setSnackbar({ open: false, message: '', severity: 'success' });
              let res;
              if (modalData) {
                res = await updateUseCase.execute(formData);
              } else {
                res = await createUseCase.execute(formData);
              }
              setModalOpen(false);
              fetchData();
              setSnackbar({
                open: true,
                message: res?.message || (modalData ? "Update successful" : "Add successful"),
                severity: "success"
              });
            } catch (e) {
              setSnackbar({
                open: true,
                message: e?.message || "Save failed",
                severity: "error"
              });
            }
          }}
        />

        <ConfirmDialog
          open={confirmOpen}
          onClose={() => setConfirmOpen(false)}
          onConfirm={async () => {
            try {
              const res = await deleteUseCase.execute(rowToDelete.id);
              setConfirmOpen(false);
              fetchData();
              setSnackbar({
                open: true,
                message: res?.message || "Delete successful",
                severity: "success"
              });
            } catch (e) {
              setSnackbar({
                open: true,
                message: e?.message || "Delete failed",
                severity: "error"
              });
            }
          }}
          title="Confirm"
          content={`Are you sure you want to delete this document type "${rowToDelete?.name}"?`}
        />

        <ConfirmDialog
          open={confirmMultiOpen}
          onClose={() => setConfirmMultiOpen(false)}
          onConfirm={async () => {
            try {
              await deleteMultiUseCase.execute(selectionModel);//documentTypeApi.deleteMulti(selectionModel);
              setConfirmMultiOpen(false);
              setSelectionModel([]);
              fetchData();
              setSnackbar({
                open: true,
                message: "Delete multiple successful",
                severity: "success"
              });
            } catch (e) {
              setSnackbar({
                open: true,
                message: e?.message || "Delete failed",
                severity: "error"
              });
            }
          }}
          title="Confirm Delete Multiple"
          content={`Are you sure you want to delete ${selectionModel.length} selected document types?`}
        />
      </CardContent>
      <CustomSnackbar
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        autoHideDuration={3000}
      />
    </Card>
  );
}