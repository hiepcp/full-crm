import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Grid,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Typography,
  Fade,
  Chip,
  Avatar,
  useTheme,
} from "@mui/material";
import {
  Person as PersonIcon,
  Search as SearchIcon,
  Email as EmailIcon,
  Badge as BadgeIcon,
  CheckCircle as CheckCircleIcon,
  Refresh as RefreshIcon,
  Add as AddIcon,
  HowToReg as RegisterIcon,
  Work as WorkIcon,
  Check as RegisteredIcon,
} from "@mui/icons-material";
import { DataGrid } from "@mui/x-data-grid";
import { RestAllCRMRepository } from "@infrastructure/repositories/RestAllCRMRepository";
import { GetAllCRMHcmWorkersUseCase } from "@application/usecases/all-crms";
import usersApi from "@infrastructure/api/usersApi";

function extractFirstName(fullName) {
  if (!fullName) return "";
  const parts = fullName.trim().split(/\s+/);
  return parts[0] || "";
}

function extractLastName(fullName) {
  if (!fullName) return "";
  const parts = fullName.trim().split(/\s+/);
  if (parts.length <= 1) return "";
  return parts.slice(1).join(" ");
}

const defaultForm = {
  email: "",
  firstName: "",
  lastName: "",
  personnelNumber: "",
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
  const theme = useTheme();

  const [workers, setWorkers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
  const [sortModel, setSortModel] = useState([{ field: "personnelNumber", sort: "asc" }]);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const [registeredEmails, setRegisteredEmails] = useState(new Set());
  const [loadingRegistered, setLoadingRegistered] = useState(false);

  const [selectedWorker, setSelectedWorker] = useState(null);
  const [form, setForm] = useState(defaultForm);
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState(null);

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

  const fetchRegisteredUsers = async () => {
    setLoadingRegistered(true);
    try {
      const resp = await usersApi.getAll({ page: 1, pageSize: 1000 });
      const items = resp?.data?.data?.items || [];
      const emails = new Set();
      items.forEach(u => {
        if (u.email && typeof u.email === 'string') {
          emails.add(u.email.toLowerCase());
        }
      });
      setRegisteredEmails(emails);
    } catch (error) {
      console.error("Failed to load registered users", error);
    } finally {
      setLoadingRegistered(false);
    }
  };

  const fetchWorkers = async () => {
    setLoading(true);
    try {
      const filters = [];

      if (search.trim()) {
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

  useEffect(() => {
    fetchRegisteredUsers();
  }, []);

  useEffect(() => {
    fetchWorkers();
  }, [paginationModel, search, orderBy, getHcmWorkersUseCase]);

  const handleSelectWorker = (worker) => {
    const normalized = normalizeWorker(worker);
    setSelectedWorker(normalized);
    setForm((prev) => ({
      ...prev,
      email: normalized.email || prev.email,
      firstName: extractFirstName(normalized.name),
      lastName: extractLastName(normalized.name),
      personnelNumber: normalized.personnelNumber || prev.personnelNumber,
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
        if (registeredEmails.has(form.email.toLowerCase())) {
          setAlert({ severity: "warning", message: "User with this email is already registered" });
          return;
        }
        const payload = {
          email: form.email,
          firstName: form.firstName || null,
          lastName: form.lastName || null,
          isActive: true,
        };
        await usersApi.create(payload);
        setAlert({ severity: "success", message: "User created successfully!" });

        await fetchWorkers();
        await fetchRegisteredUsers();
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
    {
      field: "personnelNumber",
      headerName: "Personnel #",
      width: 140,
      renderCell: (params) => (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <BadgeIcon fontSize="small" color="action" />
          <Typography variant="body2">{params.value}</Typography>
        </Box>
      ),
    },
    {
      field: "name",
      headerName: "Name",
      flex: 1,
      minWidth: 200,
      renderCell: (params) => (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <PersonIcon fontSize="small" color="action" />
          <Typography variant="body2">{params.value}</Typography>
        </Box>
      ),
    },
    {
      field: "email",
      headerName: "Email",
      flex: 1,
      minWidth: 220,
      renderCell: (params) => (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <EmailIcon fontSize="small" color="action" />
          <Typography variant="body2">{params.value}</Typography>
        </Box>
      ),
    },
    {
      field: "status",
      headerName: "Status",
      width: 120,
      renderCell: (params) => {
        const isRegistered = registeredEmails.has(params.row.email?.toLowerCase());
        return (
          <Chip
            label={isRegistered ? "Registered" : "New"}
            size="small"
            color={isRegistered ? "success" : "default"}
            icon={isRegistered ? <RegisteredIcon fontSize="small" /> : null}
            sx={{ borderRadius: 1 }}
          />
        );
      },
    },
    {
      field: "actions",
      headerName: "",
      sortable: false,
      filterable: false,
      width: 100,
      renderCell: (params) => {
        const isRegistered = registeredEmails.has(params.row.email?.toLowerCase());
        return (
          <Button
            variant="contained"
            size="small"
            startIcon={<AddIcon />}
            onClick={(e) => {
              e.stopPropagation();
              handleSelectWorker(params.row);
            }}
            disabled={isRegistered}
          >
            {isRegistered ? "Added" : "Add"}
          </Button>
        );
      },
    },
  ];

  const isFormValid = form.email && !registeredEmails.has(form.email.toLowerCase());

  return (
    <Box sx={{ p: 3, bgcolor: theme.palette.background.default, minHeight: "100vh" }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight="bold" sx={{ color: theme.palette.primary.main, mb: 1 }}>
          Register User from HCM Workers
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Select an HCM Worker to register them as a CRM user
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Paper
            elevation={0}
            sx={{
              borderRadius: 2,
              overflow: "hidden",
              border: `1px solid ${theme.palette.divider}`,
            }}
          >
            <Box
              sx={{
                p: 3,
                bgcolor: theme.palette.primary.main,
                color: theme.palette.primary.contrastText,
              }}
            >
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                <WorkIcon sx={{ verticalAlign: "middle", mr: 1 }} />
                HCM Workers Directory
              </Typography>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <TextField
                  placeholder="Search by email, name, or personnel number..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  fullWidth
                  size="small"
                  variant="outlined"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                    sx: {
                      bgcolor: theme.palette.background.paper,
                      borderRadius: 1,
                      color: theme.palette.text.primary,
                      "& .MuiOutlinedInput-notchedOutline": {
                        borderColor: "transparent",
                      },
                      "&:hover .MuiOutlinedInput-notchedOutline": {
                        borderColor: "transparent",
                      },
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                        borderColor: "transparent",
                      },
                    },
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      setPaginationModel((prev) => ({ ...prev, page: 0 }));
                      setSearch(searchInput.trim());
                    }
                  }}
                />
                <Button
                  variant="contained"
                  onClick={() => {
                    setPaginationModel((prev) => ({ ...prev, page: 0 }));
                    setSearch(searchInput.trim());
                  }}
                  sx={{
                    bgcolor: theme.palette.primary.contrastText,
                    color: theme.palette.primary.main,
                    fontWeight: 600,
                    textTransform: "none",
                    "&:hover": {
                      bgcolor: "rgba(255,255,255,0.9)",
                    },
                  }}
                  startIcon={<SearchIcon />}
                >
                  Search
                </Button>
              </Stack>
            </Box>

            <Box sx={{ height: 500, width: "100%" }}>
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
                onRowClick={(params) => {
                  if (!registeredEmails.has(params.row.email?.toLowerCase())) {
                    handleSelectWorker(params.row);
                  }
                }}
                getRowId={(row) => row.id}
                sx={{
                  border: "none",
                  "& .MuiDataGrid-columnHeaders": {
                    bgcolor: theme.palette.grey[50],
                    borderBottom: `2px solid ${theme.palette.divider}`,
                    "& .MuiDataGrid-columnHeaderTitle": {
                      fontWeight: 600,
                    },
                  },
                  "& .MuiDataGrid-row": {
                    "&:hover": {
                      bgcolor: theme.palette.action.hover,
                    },
                  },
                  "& .MuiDataGrid-cell": {
                    borderBottom: `1px solid ${theme.palette.divider}`,
                  },
                }}
              />
            </Box>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <Fade in={selectedWorker !== null} mountOnEnter unmountOnExit>
            <Paper
              elevation={0}
              sx={{
                borderRadius: 2,
                border: `1px solid ${theme.palette.divider}`,
                display: selectedWorker ? "block" : "none",
              }}
            >
              <CardHeader
                avatar={
                  <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                    <WorkIcon />
                  </Avatar>
                }
                title={
                  <Typography variant="h6" fontWeight="bold">
                    {selectedWorker?.name || "Selected Worker"}
                  </Typography>
                }
                subheader={
                  <Box sx={{ mt: 1 }}>
                    <Chip
                      icon={<BadgeIcon fontSize="small" />}
                      label={selectedWorker?.personnelNumber}
                      size="small"
                      sx={{ mr: 1 }}
                    />
                  </Box>
                }
                sx={{ bgcolor: theme.palette.primary.main, color: theme.palette.primary.contrastText }}
              />
              <CardContent sx={{ p: 3 }}>
                <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2, color: theme.palette.primary.main }}>
                  Registration Information
                </Typography>

                <Stack spacing={2}>
                  <TextField
                    label="Email Address"
                    value={form.email}
                    onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                    fullWidth
                    required
                    size="small"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <EmailIcon color="action" />
                        </InputAdornment>
                      ),
                    }}
                  />
                  <TextField
                    label="First Name"
                    value={form.firstName}
                    onChange={(e) => setForm((prev) => ({ ...prev, firstName: e.target.value }))}
                    fullWidth
                    size="small"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PersonIcon color="action" />
                        </InputAdornment>
                      ),
                    }}
                  />
                  <TextField
                    label="Last Name"
                    value={form.lastName}
                    onChange={(e) => setForm((prev) => ({ ...prev, lastName: e.target.value }))}
                    fullWidth
                    size="small"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PersonIcon color="action" />
                        </InputAdornment>
                      ),
                    }}
                  />
                  <TextField
                    label="Personnel Number"
                    value={form.personnelNumber}
                    onChange={(e) => setForm((prev) => ({ ...prev, personnelNumber: e.target.value }))}
                    fullWidth
                    size="small"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <BadgeIcon color="action" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Stack>

                <Box sx={{ mt: 3, display: "flex", flexDirection: "column", gap: 2 }}>
                  <Button
                    variant="contained"
                    fullWidth
                    size="large"
                    onClick={handleSubmit}
                    disabled={!isFormValid || submitting}
                    startIcon={submitting ? <RefreshIcon sx={{ animation: "spin 1s linear infinite" }} /> : <RegisterIcon />}
                    sx={{
                      py: 1.5,
                      textTransform: "none",
                      fontWeight: 600,
                      fontSize: "1rem",
                      "@keyframes spin": {
                        "0%": { transform: "rotate(0deg)" },
                        "100%": { transform: "rotate(360deg)" },
                      },
                    }}
                  >
                    {submitting ? "Creating User..." : "Create User"}
                  </Button>

                  {selectedWorker && (
                    <Alert
                      severity="info"
                      icon={<CheckCircleIcon />}
                      sx={{
                        borderRadius: 1,
                        "& .MuiAlert-icon": {
                          fontSize: 24,
                        },
                      }}
                    >
                      <Typography variant="body2">
                        Ready to register: <strong>{selectedWorker.name}</strong>
                      </Typography>
                    </Alert>
                  )}

                  {alert && (
                    <Fade in={!!alert}>
                      <Alert
                        severity={alert.severity}
                        onClose={() => setAlert(null)}
                        sx={{
                          borderRadius: 1,
                          "& .MuiAlert-icon": {
                            fontSize: 24,
                          },
                        }}
                      >
                        {alert.message}
                      </Alert>
                    </Fade>
                  )}
                </Box>
              </CardContent>
            </Paper>
          </Fade>

          {!selectedWorker && (
            <Paper
              elevation={0}
              sx={{
                p: 4,
                borderRadius: 2,
                textAlign: "center",
                border: `2px dashed ${theme.palette.divider}`,
                bgcolor: theme.palette.grey[50],
              }}
            >
              <Avatar sx={{ bgcolor: theme.palette.primary.lighter, width: 80, height: 80, mx: "auto", mb: 2 }}>
                <WorkIcon sx={{ fontSize: 40 }} />
              </Avatar>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 1, color: theme.palette.primary.main }}>
                No Worker Selected
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Select an HCM Worker from table to fill in registration information
              </Typography>
            </Paper>
          )}
        </Grid>
      </Grid>
    </Box>
  );
}
