import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Avatar,
  Stack,
  Divider,
  CircularProgress,
  Alert,
  IconButton,
  Chip
} from '@mui/material';
import { Send as SendIcon, Person as PersonIcon, Delete as DeleteIcon } from '@mui/icons-material';
import goalsApi from '@infrastructure/api/goalsApi';

/**
 * GoalComments Component
 * Displays comment thread for a goal and allows adding new comments
 *
 * Features:
 * - Display all comments with author, timestamp
 * - Add new comment with text field
 * - Auto-refresh after adding comment
 * - Loading and error states
 * - Empty state when no comments
 */
const GoalComments = ({ goalId, currentUserEmail }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (goalId) {
      loadComments();
    }
  }, [goalId]);

  const loadComments = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await goalsApi.getComments(goalId);
      setComments(response.data.data || []);
    } catch (err) {
      console.error('Failed to load comments:', err);
      setError(err.response?.data?.message || 'Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      setSubmitting(true);
      setError(null);

      await goalsApi.addComment(goalId, {
        commentText: newComment.trim()
      });

      // Clear input and reload comments
      setNewComment('');
      await loadComments();
    } catch (err) {
      console.error('Failed to add comment:', err);
      setError(err.response?.data?.message || 'Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleAddComment();
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getInitials = (email) => {
    if (!email) return '?';
    const parts = email.split('@')[0].split('.');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return email[0].toUpperCase();
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" py={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Comments ({comments.length})
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Add Comment Section */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction="row" spacing={2} alignItems="flex-start">
            <Avatar sx={{ bgcolor: 'primary.main', mt: 1 }}>
              {getInitials(currentUserEmail)}
            </Avatar>
            <Box flex={1}>
              <TextField
                fullWidth
                multiline
                rows={3}
                placeholder="Add a comment... (Ctrl+Enter to submit)"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={submitting}
                variant="outlined"
              />
              <Box display="flex" justifyContent="flex-end" mt={1}>
                <Button
                  variant="contained"
                  startIcon={submitting ? <CircularProgress size={16} /> : <SendIcon />}
                  onClick={handleAddComment}
                  disabled={!newComment.trim() || submitting}
                >
                  {submitting ? 'Posting...' : 'Post Comment'}
                </Button>
              </Box>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {/* Comments List */}
      {comments.length === 0 ? (
        <Card>
          <CardContent>
            <Typography variant="body2" color="text.secondary" align="center">
              No comments yet. Be the first to comment!
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Stack spacing={2}>
          {comments.map((comment, index) => (
            <Card key={comment.id || index} variant="outlined">
              <CardContent>
                <Stack direction="row" spacing={2}>
                  <Avatar sx={{ bgcolor: 'secondary.main' }}>
                    {getInitials(comment.commentedBy || comment.createdBy)}
                  </Avatar>
                  <Box flex={1}>
                    <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
                      <Typography variant="subtitle2" fontWeight={600}>
                        {comment.commentedBy || comment.createdBy || 'Unknown User'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatTimestamp(comment.commentedOn || comment.createdOn)}
                      </Typography>
                      {comment.isEdited && (
                        <Chip label="Edited" size="small" variant="outlined" sx={{ height: 18 }} />
                      )}
                    </Stack>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                      {comment.commentText}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}
    </Box>
  );
};

GoalComments.propTypes = {
  goalId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  currentUserEmail: PropTypes.string
};

GoalComments.defaultProps = {
  currentUserEmail: 'user@example.com'
};

export default GoalComments;
