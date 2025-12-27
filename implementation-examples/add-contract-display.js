const fs = require('fs');
const path = require('path');

const filePath = 'E:/project/full crm/crm-system-client/src/presentation/pages/activity/ActivityDetail.jsx';

const contractDisplayCode = `

                  // Contract specific fields
                  if (category === ACTIVITY_CATEGORIES.CONTRACT) {
                    return (
                      <>
                        {activity.contractDate && (
                          <Grid size={{ xs: 12, sm: 6 }}>
                            <Typography variant="caption" color="text.secondary">CONTRACT DATE</Typography>
                            <Typography variant="body2" sx={{ mt: 0.5 }}>
                              {formatDate(activity.contractDate)}
                            </Typography>
                          </Grid>
                        )}
                        {activity.contractValue && (
                          <Grid size={{ xs: 12, sm: 6 }}>
                            <Typography variant="caption" color="text.secondary">CONTRACT VALUE</Typography>
                            <Typography variant="body2" sx={{ mt: 0.5 }}>
                              {new Intl.NumberFormat('vi-VN', {
                                style: 'currency',
                                currency: 'VND',
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 2
                              }).format(activity.contractValue)}
                            </Typography>
                          </Grid>
                        )}
                      </>
                    );
                  }
`;

try {
  let content = fs.readFileSync(filePath, 'utf8');

  const searchString = '                  }\n\n                  // Default/Note/Task specific fields';
  const replaceString = '                  }' + contractDisplayCode + '\n                  // Default/Note/Task specific fields';

  if (content.includes(searchString)) {
    content = content.replace(searchString, replaceString);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('✅ Contract display added successfully to ActivityDetail.jsx');
  } else {
    console.log('❌ Insert point not found. File may have been already modified or has different formatting.');
    console.log('Looking for pattern around line 592-594');
  }
} catch (error) {
  console.error('Error:', error.message);
}
