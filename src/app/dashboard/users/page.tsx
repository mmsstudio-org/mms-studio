'use client';

import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import type { AppUser } from '@/lib/types';
import { getUsers } from '@/lib/firestore-service';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { Users, Search, Copy, Check, RefreshCw, ArrowLeft, Smartphone } from 'lucide-react';
import Link from 'next/link';

export default function UsersPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  const fetchUsers = useCallback(async () => {
    setLoadingData(true);
    try {
      const fetchedUsers = await getUsers();
      setUsers(fetchedUsers);
    } catch (e) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch users.' });
      console.error(e);
    }
    setLoadingData(false);
  }, [toast]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
    if (user) {
      fetchUsers();
    }
  }, [user, authLoading, router, fetchUsers]);

  // Filter users based on search query
  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users;
    const queryLower = searchQuery.toLowerCase().trim();
    return users.filter((u) => {
      const emailMatch = u.email?.toLowerCase().includes(queryLower);
      const uidMatch = u.uid?.toLowerCase().includes(queryLower);
      const deviceMatch = u.device?.toLowerCase().includes(queryLower);
      return emailMatch || uidMatch || deviceMatch;
    });
  }, [users, searchQuery]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage) || 1;
  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredUsers.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredUsers, currentPage]);

  const handleCopy = (text: string, id: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast({
      title: 'Copied!',
      description: `${label} copied to clipboard.`,
    });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const truncateKey = (key?: string): string => {
    if (!key) return 'N/A';
    if (key.length <= 16) return key;
    return `${key.substring(0, 8)}...${key.substring(key.length - 8)}`;
  };

  const formatLastLogin = (timestamp?: number): string => {
    if (!timestamp) return 'N/A';
    try {
      return format(new Date(timestamp), 'MMM dd, yyyy hh:mm a');
    } catch (e) {
      return 'Invalid Date';
    }
  };

  return (
    <div className="container py-10 mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-accent transition-colors group mb-2">
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Back to Dashboard
          </Link>
          <h1 className="text-4xl font-bold tracking-tight font-heading flex items-center gap-3">
            <Users className="h-8 w-8 text-accent" /> Manage Users
          </h1>
          <p className="text-muted-foreground text-sm">
            View registered mobile/web app users and their metadata.
          </p>
        </div>
        <Button onClick={fetchUsers} disabled={loadingData} variant="outline" className="border-border hover:bg-muted/30">
          <RefreshCw className={`h-4 w-4 mr-2 ${loadingData ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Card & Search */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="lg:col-span-1 border-border/50 bg-card/20 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-heading">{loadingData ? <Skeleton className="h-8 w-16" /> : users.length}</div>
          </CardContent>
        </Card>

        <div className="lg:col-span-3 flex items-center gap-4">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by Email, UID, or Device..."
              className="pl-10 bg-card border-border/80 focus-visible:ring-accent"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>
      </div>

      {/* Main Table */}
      <Card className="border-border/50 bg-card/10 backdrop-blur-sm">
        <CardContent className="p-0">
          {loadingData ? (
            <div className="p-8 space-y-4">
              {[...Array(5)].map((_, idx) => (
                <div key={idx} className="flex gap-4 items-center">
                  <Skeleton className="h-10 flex-grow" />
                </div>
              ))}
            </div>
          ) : paginatedUsers.length === 0 ? (
            <div className="text-center py-16">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-bold font-heading">No users found</h3>
              <p className="text-muted-foreground text-sm mt-1">
                Try adjusting your search query.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-b border-border/40">
                    <TableHead className="w-[280px]">Email Address</TableHead>
                    <TableHead className="w-[240px]">UID</TableHead>
                    <TableHead className="w-[180px]">Device</TableHead>
                    <TableHead className="w-[240px]">FCM Token</TableHead>
                    <TableHead className="w-[200px]">Last Login</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedUsers.map((item) => (
                    <TableRow key={item.id} className="border-b border-border/40 hover:bg-muted/10 font-body">
                      {/* Email */}
                      <TableCell className="font-semibold text-foreground break-all">
                        {item.email}
                      </TableCell>

                      {/* UID */}
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-muted-foreground bg-muted/30 px-2 py-1 rounded border border-border/20">
                            {truncateKey(item.uid)}
                          </span>
                          {item.uid && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 rounded-md hover:bg-muted"
                              onClick={() => handleCopy(item.uid, `${item.id}-uid`, 'UID')}
                            >
                              {copiedId === `${item.id}-uid` ? (
                                <Check className="h-3.5 w-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                              )}
                            </Button>
                          )}
                        </div>
                      </TableCell>

                      {/* Device */}
                      <TableCell className="text-foreground/90 font-medium">
                        {item.device ? (
                          <span className="flex items-center gap-1.5">
                            <Smartphone className="h-4 w-4 text-accent" />
                            {item.device}
                          </span>
                        ) : (
                          <span className="text-muted-foreground/60">N/A</span>
                        )}
                      </TableCell>

                      {/* FCM Token */}
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {item.fcmToken ? (
                            <>
                              <span className="font-mono text-xs text-muted-foreground bg-muted/30 px-2 py-1 rounded border border-border/20">
                                {truncateKey(item.fcmToken)}
                              </span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 rounded-md hover:bg-muted"
                                onClick={() => handleCopy(item.fcmToken!, `${item.id}-fcm`, 'FCM Token')}
                              >
                                {copiedId === `${item.id}-fcm` ? (
                                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                                ) : (
                                  <Copy className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                                )}
                              </Button>
                            </>
                          ) : (
                            <span className="text-muted-foreground/60 text-sm">N/A</span>
                          )}
                        </div>
                      </TableCell>

                      {/* Last Login */}
                      <TableCell className="text-muted-foreground text-sm">
                        {formatLastLogin(item.lastLogin)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination Controls */}
      {!loadingData && totalPages > 1 && (
        <div className="flex justify-between items-center mt-4">
          <p className="text-sm text-muted-foreground font-body">
            Showing Page <span className="font-semibold">{currentPage}</span> of <span className="font-semibold">{totalPages}</span> ({filteredUsers.length} total users)
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((prev) => prev - 1)}
              className="border-border hover:bg-muted/30"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((prev) => prev + 1)}
              className="border-border hover:bg-muted/30"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
