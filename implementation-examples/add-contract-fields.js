const fs = require('fs');
const path = require('path');

const filePath = 'E:/project/full crm/crm-system-client/src/presentation/components/common/ActivityForms/components/ActivityCategoryFields.jsx';

const contractFieldsCode = `
  // Contract fields
  if (formData.activityCategory === 'contract') {
    return (
      <Box>
        {/* Contract Details Section */}
        <Box sx={{ mb: 2 }}>
          <Box display="flex" alignItems="center" sx={{ mb: 1 }}>
            <EventIcon sx={{ mr: 0.5, fontSize: 18, color: theme.palette.primary.main }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              Contract Information
            </Typography>
          </Box>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                type="date"
                label="Contract Date"
                value={formData.contractDate || ''}
                disabled={disabled}
                onChange={(e) => updateFormData({ contractDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
                fullWidth
                size="small"
                variant="outlined"
                helperText="Date when contract was signed or becomes effective"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                type="number"
                label="Contract Value"
                value={formData.contractValue || ''}
                disabled={disabled}
                onChange={(e) => {
                  const value = e.target.value;
                  // Validate non-negative
                  if (value === '' || parseFloat(value) >= 0) {
                    updateFormData({ contractValue: value });
                  }
                }}
                InputLabelProps={{ shrink: true }}
                inputProps={{
                  min: 0,
                  step: 0.01,
                  max: 999999999999.99
                }}
                fullWidth
                size="small"
                variant="outlined"
                helperText="Financial value of the contract (optional)"
              />
            </Grid>
          </Grid>
        </Box>
      </Box>
    );
  }
`;

try {
  let content = fs.readFileSync(filePath, 'utf8');

  const searchString = '  }\n\n  // Email fields';
  const replaceString = '  }' + contractFieldsCode + '\n  // Email fields';

  if (content.includes(searchString)) {
    content = content.replace(searchString, replaceString);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('✅ Contract fields added successfully to ActivityCategoryFields.jsx');
  } else {
    console.log('❌ Insert point not found. File may have been already modified.');
  }
} catch (error) {
  console.error('Error:', error.message);
}
