"use client";

import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Loader2, Search, RefreshCw } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import axios from 'axios';
import { FacultyUser, UserRole } from '@prisma/client';

interface AlertState {
  type: string;
  message: string;
}

export default function FacultyManagement() {
  const [users, setUsers] = useState<FacultyUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<FacultyUser | null>(null);
  const [formData, setFormData] = useState({ email: '', role: '' });
  const [alert, setAlert] = useState<AlertState | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/admin/user');
      if (response.data) {
        const data = await response.data;
        setUsers(data);
      } else {
        showAlert('error', 'Failed to fetch users');
      }
    } catch (error) {
      showAlert('error', 'Error fetching users');
    } finally {
      setLoading(false);
    }
  };

  const showAlert = (type: string, message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  const handleCreate = async () => {
    if (!formData.email || !formData.role) {
      showAlert('error', 'Please fill in all fields');
      return;
    }

    setActionLoading(true);
    try {
      const response = await axios.post('/api/admin/user', formData);
      const data = response.data;

      if (response.status === 200 || response.status === 201) {
        showAlert('success', data.message || 'User created successfully');
        setIsCreateOpen(false);
        setFormData({ email: '', role: '' });
        fetchUsers();
      } else {
        showAlert('error', data.error || 'Failed to create user');
      }
    } catch (error) {
      showAlert('error', 'Error creating user');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!formData.email || !formData.role) {
      showAlert('error', 'Please fill in all fields');
      return;
    }

    setActionLoading(true);
    try {
      const response = await axios.patch('/api/admin/user', formData);
      const data = response.data;

      if (response.status === 200 || response.status === 201) {
        showAlert('success', data.message || 'User updated successfully');
        setIsEditOpen(false);
        setSelectedUser(null);
        setFormData({ email: '', role: '' });
        fetchUsers();
      } else {
        showAlert('error', data.error || 'Failed to update user');
      }
    } catch (error) {
      showAlert('error', 'Error updating user');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedUser) return;
    
    setActionLoading(true);
    try {
      const response = await axios.delete(`/api/admin/user?email=${encodeURIComponent(selectedUser.email)}`);

      const data = await response.data;

      if (response.status === 200 || response.status === 201) {
        showAlert('success', data.message || 'User deleted successfully');
        setIsDeleteOpen(false);
        setSelectedUser(null);
        fetchUsers();
      } else {
        showAlert('error', data.error || 'Failed to delete user');
      }
    } catch (error) {
      showAlert('error', 'Error deleting user');
    } finally {
      setActionLoading(false);
    }
  };

  const openEditDialog = (user: FacultyUser) => {
    setSelectedUser(user);
    setFormData({ email: user.email, role: user.role });
    setIsEditOpen(true);
  };

  const openDeleteDialog = (user: FacultyUser) => {
    setSelectedUser(user);
    setIsDeleteOpen(true);
  };

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleBadgeColor = (role:UserRole) => {
    const colors = {
      ADMIN: 'bg-red-100 text-red-800 border-red-200',
      TEACHER: 'bg-blue-100 text-blue-800 border-blue-200',
      STUDENT: 'bg-green-100 text-green-800 border-green-200',
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Faculty User Management</h1>
          <p className="text-slate-600">Manage faculty users, roles, and permissions</p>
        </div>

        {/* Alert */}
        {alert && (
          <Alert className={`mb-6 ${alert.type === 'error' ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
            <AlertDescription className={alert.type === 'error' ? 'text-red-800' : 'text-green-800'}>
              {alert.message}
            </AlertDescription>
          </Alert>
        )}

        {/* Actions Bar */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder="Search by email or role..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                onClick={fetchUsers}
                variant="outline"
                className="flex-1 sm:flex-none"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Button
                onClick={() => {
                  setFormData({ email: '', role: '' });
                  setIsCreateOpen(true);
                }}
                className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add User
              </Button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="font-semibold">Email</TableHead>
                    <TableHead className="font-semibold">Role</TableHead>
                   
                    <TableHead className="text-right font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-slate-500">
                        No users found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => (
                      <TableRow key={user.email} className="hover:bg-slate-50">
                        <TableCell className="font-medium">{user.email}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getRoleBadgeColor(user.role)}>
                            {user.role}
                          </Badge>
                        </TableCell>
                    
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              onClick={() => openEditDialog(user)}
                              variant="ghost"
                              size="sm"
                              className="hover:bg-blue-50 hover:text-blue-600"
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              onClick={() => openDeleteDialog(user)}
                              variant="ghost"
                              size="sm"
                              className="hover:bg-red-50 hover:text-red-600"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        {/* Create Dialog */}
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create Faculty User</DialogTitle>
              <DialogDescription>
                Add a new faculty user to the system
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="create-email">Email</Label>
                <Input
                  id="create-email"
                  type="email"
                  placeholder="user@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-role">Role</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => setFormData({ ...formData, role: value })}
                >
                  <SelectTrigger id="create-role">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(UserRole).map((role) => (
                      <SelectItem key={role} value={role}>
                        {role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
                disabled={actionLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={actionLoading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {actionLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Create User
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Faculty User</DialogTitle>
              <DialogDescription>
                Update the role for this faculty user
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  disabled
                  className="bg-slate-50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-role">Role</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => setFormData({ ...formData, role: value })}
                >
                  <SelectTrigger id="edit-role">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(UserRole).map((role) => (
                      <SelectItem key={role} value={role}>
                        {role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsEditOpen(false)}
                disabled={actionLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdate}
                disabled={actionLoading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {actionLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Update User
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Delete Faculty User</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this user? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            {selectedUser && (
              <div className="py-4">
                <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-slate-600">Email:</span>
                    <span className="text-sm font-semibold">{selectedUser.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-slate-600">Role:</span>
                    <Badge variant="outline" className={getRoleBadgeColor(selectedUser.role)}>
                      {selectedUser.role}
                    </Badge>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsDeleteOpen(false)}
                disabled={actionLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleDelete}
                disabled={actionLoading}
                className="bg-red-600 hover:bg-red-700"
              >
                {actionLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Delete User
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}