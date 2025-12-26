import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
  Chip,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { RestAllCRMRepository } from "@infrastructure/repositories/RestAllCRMRepository";
import { GetAllCRMHcmWorkersUseCase } from "@application/usecases/all-crms";
import authRolesApi from "@infrastructure/api/authRolesApi";
import authUsersApi from "@infrastructure/api/authUsersApi";

const defaultForm = {
  email: "",
  fullName: "",
  userName: "",
  roleIds: [],
};

const columnFieldMap = {
  personnelNumber: "PersonnelNumber",
  name: "Name",
  email: "Email",
};

function normalizeWorker(worker) {
  return {
    id:
      worker?.PersonnelNumber ||
      worker?.personnelNumber ||
      worker?.Email ||
      worker?.email ||
      crypto.randomUUID(),
    personnelNumber: worker?.PersonnelNumber || worker?.personnelNumber || "",
    name: worker?.Name || worker?.name || "",
    email: worker?.Email || worker?.email || "",
  };
}

export default function HcmWorkerRegister() {
  const [workers, setWorkers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
  const [sortModel, setSortModel] = useState([{ field: "personnelNumber", sort: "asc" }]);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const [roles, setRoles] = useState([]);
  const [rolesLoading, setRolesLoading] = useState(false);

  const [selectedWorker, setSelectedWorker] = useState(null);
  const [form, setForm] = useState(defaultForm);
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState(null);

  // AllCRM repository and use case
  const [allCRMRepository] = useState(() => new RestAllCRMRepository());
  const [getHcmWorkersUseCase] = useState(() => new GetAllCRMHcmWorkersUseCase(allCRMRepository));
  const orderBy = useMemo(() => {
    if (!sortModel?.length) return { field: "PersonnelNumber", order: "asc" };
    const { field, sort } = sortModel[0];
    return {
      field: columnFieldMap[field] || "PersonnelNumber",
      order: sort || "asc",
    };
  }, [sortModel]);

  useEffect(() => {
    const fetchRoles = async () => {
      setRolesLoading(true);
      try {
        const resp = await authRolesApi.getAll(1, 200);
        const items = resp?.data?.data?.items || resp?.data?.data?.Items || resp?.data?.data?.value || [];
        const normalized = items.map((r) => ({
          id: r.roleId ?? r.id ?? r.RoleId ?? r.Id,
          name: r.name ?? r.Name ?? r.code ?? r.Code ?? "",
        })).filter((r) => r.id);
        setRoles(normalized);
      } catch (error) {
        console.error("Failed to load roles", error);
        setAlert({ severity: "error", message: "Cannot load roles list" });
      } finally {
        setRolesLoading(false);
      }
    };
    fetchRoles();
  }, []);

  useEffect(() => {
    const fetchWorkers = async () => {
      setLoading(true);
      try {
        // Prepare filters for AllCRM API
        const filters = [];

        // Add search filter if search term exists
        if (search.trim()) {
          // Search across multiple fields: PersonnelNumber, Name, Email
          filters.push({
            Logic: "and",
            Column: "PersonnelNumber",
            Operator: "contains",
            Value: search.trim()
          });
          filters.push({
            Logic: "and",
            Column: "Name",
            Operator: "contains",
            Value: search.trim()
          });
          filters.push({
            Logic: "and",
            Column: "Email",
            Operator: "contains",
            Value: search.trim()
          });
        }

        // Filter out empty emails
        filters.push({
          Logic: "and",
          Column: "Email",
          Operator: "ne",
          Value: ""
        });

        const resp = await getHcmWorkersUseCase.execute(
          paginationModel.page + 1,
          paginationModel.pageSize,
          orderBy.field,
          orderBy.order,
          filters
        );

        const data = resp || {};
        const items = data.items || [];
        const normalized = items.map(normalizeWorker);
        setWorkers(normalized);
        setTotal(data.totalCount ?? data.TotalCount ?? data["@odata.count"] ?? normalized.length);
      } catch (error) {        
        console.error("Failed to load workers", error);
        setAlert({ severity: "error", message: "Cannot load HCM Workers list" });
      } finally {
        setLoading(false);
      }
    };
    fetchWorkers();
  }, [paginationModel, search, orderBy, getHcmWorkersUseCase]);

  const handleSelectWorker = (worker) => {
    const normalized = normalizeWorker(worker);
    setSelectedWorker(normalized);
    setForm((prev) => ({
      ...prev,
      email: normalized.email || prev.email,
      fullName: normalized.name || prev.fullName,
      userName: (normalized.email || "").split("@")[0] || normalized.personnelNumber || prev.userName,
    }));
    setAlert(null);
  };

  const handleSubmit = async () => {
      setSubmitting(true);
      setAlert(null);
      try {
        if (!form.email) {
          setAlert({ severity: "warning", message: "Email is required" });
          return;
        }
        const payload = {
          email: form.email,
          fullName: form.fullName,
          userName: form.userName,
          roleIds: form.roleIds,
        };
        await authUsersApi.create(payload);
        setAlert({ severity: "success", message: "Create user successfully" });
      } catch (error) {
        const message =
          error?.response?.data?.message ||
          error?.message ||
          "Cannot create user";
        setAlert({ severity: "error", message });
      } finally {
        setSubmitting(false);
      }
  };

  const columns = [
    { field: "personnelNumber", headerName: "Personnel #", width: 140 },
    { field: "name", headerName: "Name", flex: 1, minWidth: 200 },
    { field: "email", headerName: "Email", flex: 1, minWidth: 220 },
    {
      field: "actions",
      headerName: "",
      sortable: false,
      filterable: false,
      width: 140,
      renderCell: (params) => (
        <Button
          variant="outlined"
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            handleSelectWorker(params.row);
          }}
        >
          Select
        </Button>
      ),
    },
  ];

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" gutterBottom>
        Register User from RSVNHcmWorkers
      </Typography>

      <Grid container spacing={2}>
        <Grid item xs={12} md={7}>
          <Card>
            <CardContent>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2} mb={2}>
                <TextField
                  label="Search by email / name / personnel number"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  fullWidth
                  size="small"
                />
                <Button
                  variant="contained"
                  onClick={() => {
                    setPaginationModel((prev) => ({ ...prev, page: 0 }));
                    setSearch(searchInput.trim());
                  }}
                >
                  Search
                </Button>
              </Stack>

              <div style={{ height: 480, width: "100%" }}>
                {/* #endregion */}
                <DataGrid
                  rows={workers}
                  columns={columns}
                  rowCount={total}
                  loading={loading}
                  pagination
                  paginationMode="server"
                  paginationModel={paginationModel}
                  onPaginationModelChange={(model) => {
                    setPaginationModel((prev) => {
                      const pageSizeChanged = prev.pageSize !== model.pageSize;
                      // Reset to first page if page size changes
                      return pageSizeChanged ? { ...model, page: 0 } : model;
                    });
                  }}
                  pageSizeOptions={[5, 10, 25, 50]}
                  sortingMode="server"
                  sortModel={sortModel}
                  onSortModelChange={(model) => {
                    setSortModel(model);
                    setPaginationModel((prev) => ({ ...prev, page: 0 }));
                  }}
                  disableRowSelectionOnClick
                  onRowClick={(params) => handleSelectWorker(params.row)}
                  getRowId={(row) => row.id}
                />
              </div>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={5}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Registration information
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Select an HCM Worker to automatically fill in information, then add username and role.
              </Typography>

              <Divider sx={{ my: 2 }} />

              <Stack spacing={2}>
                <TextField
                  label="Email"
                  value={form.email}
                  onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                  fullWidth
                  required
                />
                <TextField
                  label="Full Name"
                  value={form.fullName}
                  onChange={(e) => setForm((prev) => ({ ...prev, fullName: e.target.value }))}
                  fullWidth
                />
                <TextField
                  label="Username"
                  value={form.userName}
                  onChange={(e) => setForm((prev) => ({ ...prev, userName: e.target.value }))}
                  fullWidth
                />
                <FormControl fullWidth>
                  <InputLabel id="role-select-label">Roles</InputLabel>
                  <Select
                    labelId="role-select-label"
                    label="Roles"
                    multiple
                    value={form.roleIds}
                    onChange={(e) => setForm((prev) => ({ ...prev, roleIds: e.target.value }))}
                    renderValue={(selected) => (
                      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                        {selected.map((value) => {
                          const role = roles.find((r) => r.id === value);
                          return <Chip key={value} label={role?.name || value} />;
                        })}
                      </Box>
                    )}
                    disabled={rolesLoading}
                  >
                    {roles.map((role) => (
                      <MenuItem key={role.id} value={role.id}>
                        {role.name} ({role.id})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <Button variant="contained" onClick={handleSubmit} disabled={submitting}>
                  {submitting ? "Creating..." : "Create User"}
                </Button>

                {selectedWorker && (
                  <Alert severity="info">
                    Using worker: {selectedWorker.name} ({selectedWorker.personnelNumber})
                  </Alert>
                )}
                {alert && (
                  <Alert severity={alert.severity} onClose={() => setAlert(null)}>
                    {alert.message}
                  </Alert>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

