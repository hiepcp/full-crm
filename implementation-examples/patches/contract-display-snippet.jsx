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
