import { useState, useCallback } from "react";
import { RestDocumentTypeRepository } from "@infrastructure/repositories/RestDocumentTypeRepository";
import { GetPagingDocumentTypesUseCase } from "@application/usecases/document-type/GetPagingDocumentTypesUseCase";

const repo = new RestDocumentTypeRepository();
const getPagingDocumentTypesUseCase = new GetPagingDocumentTypesUseCase(repo);

export default function useDocumentTypeData() {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10,
  });
  const [filterModel, setFilterModel] = useState({
    items: [{ columnField: "name", operatorValue: "contains", value: "" }],
  });
  const [sortModel, setSortModel] = useState([{ field: "id", sort: "asc" }]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let filterVal = "";
      if (filterModel.items && filterModel.items[0]?.value !== undefined) {
        filterVal = filterModel.items[0].value;
      }
      const payload = filterVal
        ? [{ column: "Name", operator: "like", value: filterVal }]
        : [];
      const sortField = sortModel[0]?.field || "name";
      const sortOrder = sortModel[0]?.sort || "asc";
      const response = await getPagingDocumentTypesUseCase.execute(
        (paginationModel.page || 0) + 1,
        paginationModel.pageSize,
        sortField.charAt(0).toUpperCase() + sortField.slice(1),
        sortOrder,
        payload
      );
      if (response?.data) {
        setData(response.data.items || []);
        setTotal(response.data.totalCount || 0);
      } else if (response?.items) {
        setData(response.items || []);
        setTotal(response.totalCount || 0);
      } else {
        setError("API không trả về dữ liệu hợp lệ");
      }
    } catch (err) {
      console.error("Error:", err);
      setError("Không thể tải dữ liệu");
    } finally {
      setLoading(false);
    }
  }, [paginationModel, filterModel, sortModel]);

  return {
    data,
    total,
    loading,
    error,
    paginationModel,
    setPaginationModel,
    filterModel,
    setFilterModel,
    sortModel,
    setSortModel,
    fetchData,
  };
}