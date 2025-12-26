import { formatDateTime } from "@utils/formatDateTime";
import DocumentTypeActionCell from "@presentation/pages/document-type/components/DocumentTypeActionCell";

export default function useDocumentTypeColumns({ onEdit, onDelete, permissionList = [] }) {
  // Kiểm tra quyền
  const canEdit = permissionList.includes("Update");
  const canDelete = permissionList.includes("Delete");
  const columns = [
    { field: "id", headerName: "ID", width: 90 },
    { field: "name", headerName: "Name", flex: 1, filterable: true },
    { field: "location", headerName: "Location", flex: 1, filterable: true },
    {
      field: "createdDate",
      headerName: "Created Date",
      flex: 1,
      valueFormatter: (params) => formatDateTime(params),
    },
    { field: "createdBy", headerName: "Created By", flex: 1 },
    {
      field: "updatedDate",
      headerName: "Updated Date",
      flex: 1,
      valueFormatter: (params) => formatDateTime(params),
    },
    { field: "updatedBy", headerName: "Updated By", flex: 1 },
  ];
  if (canEdit || canDelete) {
    columns.push({
      field: "actions",
      headerName: "Actions",
      width: 120,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <DocumentTypeActionCell
          row={params.row}
          onEdit={onEdit}
          onDelete={onDelete}
          canEdit={canEdit}
          canDelete={canDelete}
        />
      ),
    });
  }
  return columns;
}