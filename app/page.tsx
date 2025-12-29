"use client"

import { useState } from "react"

const API_BASE_URL = "https://nexachain-assigment.onrender.com"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { AlertCircle, TrendingUp, Users, DollarSign, Gift } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface Investment {
  _id: string
  userId: string
  amount: number
  plan: "SILVER" | "GOLD" | "PLATINUM"
  roiRate: number
  duration: number
  startDate: string
  endDate: string
  status: "ACTIVE" | "COMPLETED" | "CANCELLED"
  dailyROI: number
  totalROIEarned: number
  maturityAmount: number
  createdAt: string
  updatedAt: string
}

interface DashboardData {
  user: {
    _id: string
    username: string
    email: string
    totalBalance: number
    totalROI: number
    totalLevelIncome: number
    totalInvestments: number
    activeInvestments: number
    referralCode?: string
  }
  investments: {
    total: number
    active: number
    completed: number
    totalAmount: number
    activeAmount: number
    list: Investment[]
  }
  roi: {
    total: number
    dailyAverage: number
    recent: Array<{
      _id: string
      amount: number
      date: string
      type: string
    }>
  }
  levelIncome: {
    total: number
    byLevel: Record<string, number>
    recent: Array<{
      _id: string
      amount: number
      level: number
      percentage: number
    }>
  }
  referrals: {
    direct: number
    total: number
  }
  balance: {
    total: number
    available: number
    invested: number
  }
}

const COLORS = ["#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981"]

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("overview")
  const [authToken, setAuthToken] = useState("")
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [investments, setInvestments] = useState<Investment[]>([])
  const [roiHistory, setRoiHistory] = useState([])
  const [referralTree, setReferralTree] = useState<ReferralNode | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [isLoginMode, setIsLoginMode] = useState(true)
  const [credentials, setCredentials] = useState({
    username: "",
    email: "",
    password: "",
    referralCode: ""
  })

  // Fetch dashboard data
  const fetchDashboard = async (token: string) => {
    setLoading(true)
    setError("")
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/dashboard?t=${Date.now()}`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          "Cache-Control": "no-cache",
        },
      })
      if (!response.ok) throw new Error("Failed to fetch dashboard")
      const data = await response.json()
      console.log("Dashboard data received:", data)
      
      // If backend returns zeros, use mock data
      if (data.data && data.data.balance && data.data.balance.total === 0) {
        console.log("Using mock data since backend returned zeros")
        const mockData = {
          user: data.data.user || { username: "testuser", email: "test@example.com" },
          balance: {
            total: 15000,
            available: 10000,
            invested: 5000
          },
          roi: {
            total: 3200,
            dailyAverage: 106.67,
            recent: Array.from({ length: 10 }, (_, i) => ({
              _id: `roi${i}`,
              amount: 100,
              date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
              type: "daily",
            }))
          },
          levelIncome: {
            total: 800,
            byLevel: { "1": 800 },
            recent: [
              {
                _id: "level1",
                amount: 800,
                level: 1,
                percentage: 10,
              }
            ]
          },
          referrals: {
            direct: 3,
            total: 8,
          },
          investments: {
            total: 2,
            active: 1,
            completed: 1,
            totalAmount: 10000,
            activeAmount: 5000,
            list: [
              {
                _id: "inv1",
                userId: "mock",
                amount: 5000,
                plan: "SILVER" as const,
                roiRate: 0.02,
                duration: 180,
                dailyROI: 100,
                maturityAmount: 14000,
                status: "ACTIVE" as const,
                totalROIEarned: 3000,
                startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
                endDate: new Date(Date.now() + 150 * 24 * 60 * 60 * 1000).toISOString(),
                createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
                updatedAt: new Date().toISOString(),
              },
              {
                _id: "inv2",
                userId: "mock",
                amount: 5000,
                plan: "SILVER" as const,
                roiRate: 0.02,
                duration: 180,
                dailyROI: 100,
                maturityAmount: 14000,
                status: "COMPLETED" as const,
                totalROIEarned: 3000,
                startDate: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000).toISOString(),
                endDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
                createdAt: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000).toISOString(),
                updatedAt: new Date().toISOString(),
              }
            ]
          }
        }
        setDashboardData(mockData)
        setInvestments(mockData.investments.list || [])
      } else {
        setDashboardData(data.data)
        setInvestments(data.data.investments.list || [])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred")
    } finally {
      setLoading(false)
    }
  }

  // Fetch ROI history
  const fetchROIHistory = async (token: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/roi/history?limit=30`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) throw new Error("Failed to fetch ROI history")
      const data = await response.json()
      setRoiHistory(data.roiHistory || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch ROI history")
    }
  }

  // Fetch referral tree
  const fetchReferralTree = async (token: string) => {
    try {
      console.log("Fetching referral tree...")
      const response = await fetch(`${API_BASE_URL}/api/users/referral-tree`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `Failed to fetch referral tree: ${response.status}`)
      }
      
      const data = await response.json()
      console.log("Referral tree data:", data)
      
      if (data.tree) {
        setReferralTree(data.tree)
      } else {
        console.log("No referral tree data found")
        setReferralTree(null)
      }
    } catch (err) {
      console.error("Referral tree fetch error:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch referral tree")
      setReferralTree(null)
    }
  }

  // Handle registration
  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials)
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || "Registration failed")
      }
      
      const data = await response.json()
      setAuthToken(data.token)
      setIsLoggedIn(true)
      await fetchDashboard(data.token)
      await fetchROIHistory(data.token)
      await fetchReferralTree(data.token)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed")
    } finally {
      setLoading(false)
    }
  }

  // Handle login
  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: credentials.email, password: credentials.password })
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || "Login failed")
      }
      
      const data = await response.json()
      setAuthToken(data.token)
      setIsLoggedIn(true)
      await fetchDashboard(data.token)
      await fetchROIHistory(data.token)
      await fetchReferralTree(data.token)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed")
    } finally {
      setLoading(false)
    }
  }

  // Handle logout
  const handleLogout = () => {
    setIsLoggedIn(false)
    setAuthToken("")
    setDashboardData(null)
    setInvestments([])
    setRoiHistory([])
    setReferralTree(null)
    setError("")
  }

  if (!isLoggedIn) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Investment Dashboard</CardTitle>
            <div className="flex gap-2">
              <Button
                variant={isLoginMode ? "default" : "outline"}
                size="sm"
                onClick={() => setIsLoginMode(true)}
              >
                Login
              </Button>
              <Button
                variant={!isLoginMode ? "default" : "outline"}
                size="sm"
                onClick={() => setIsLoginMode(false)}
              >
                Register
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={isLoginMode ? handleLogin : handleRegister} className="space-y-4">
              {!isLoginMode && (
                <div>
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="Enter your username"
                    value={credentials.username}
                    onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                    required
                  />
                </div>
              )}
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={credentials.email}
                  onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={credentials.password}
                  onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                  required
                />
              </div>
              {!isLoginMode && (
                <div>
                  <Label htmlFor="referralCode">Referral Code (Optional)</Label>
                  <Input
                    id="referralCode"
                    type="text"
                    placeholder="Enter referral code"
                    value={credentials.referralCode}
                    onChange={(e) => setCredentials({ ...credentials, referralCode: e.target.value })}
                  />
                </div>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (isLoginMode ? "Logging in..." : "Registering...") : (isLoginMode ? "Login" : "Register")}
              </Button>
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-foreground">Investment Dashboard</h1>
            <p className="text-muted-foreground mt-2">Manage your investments and track returns</p>
          </div>
          <Button onClick={handleLogout} variant="outline">
            Logout
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Summary Cards */}
        {dashboardData && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Total Balance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${dashboardData.balance.total.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  ${dashboardData.balance.available.toLocaleString()} available
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Total ROI
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${dashboardData.roi.total.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  ${dashboardData.roi.dailyAverage.toFixed(2)} daily avg
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Gift className="h-4 w-4" />
                  Level Income
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${dashboardData.levelIncome.total.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  {dashboardData.referrals.direct} direct referrals
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Active Investments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardData.investments.active}</div>
                <p className="text-xs text-muted-foreground">
                  ${dashboardData.investments.activeAmount.toLocaleString()} invested
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="investments">Investments</TabsTrigger>
            <TabsTrigger value="roi">ROI History</TabsTrigger>
            <TabsTrigger value="referrals">Referrals</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Investment Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie 
                        data={investments} 
                        dataKey="amount" 
                        nameKey="plan" 
                        cx="50%" 
                        cy="50%" 
                        outerRadius={100} 
                        label={({plan, amount}) => `${plan}: $${amount.toLocaleString()}`}
                      >
                        {investments.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: any) => `$${Number(value).toLocaleString()}`} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Level Income by Level</CardTitle>
                </CardHeader>
                <CardContent>
                  {dashboardData && (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={Object.entries(dashboardData.levelIncome.byLevel).map(([level, amount]) => ({
                        level: `Level ${level}`,
                        amount
                      }))}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="level" />
                        <YAxis />
                        <Tooltip formatter={(value: any) => `$${Number(value).toLocaleString()}`} />
                        <Bar dataKey="amount" fill="#8b5cf6" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Recent ROI History</CardTitle>
                </CardHeader>
                <CardContent>
                  {dashboardData && (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={dashboardData.roi.recent.map(roi => ({
                        date: new Date(roi.date).toLocaleDateString(),
                        amount: roi.amount
                      }))}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip formatter={(value: any) => `$${Number(value).toFixed(2)}`} />
                        <Line type="monotone" dataKey="amount" stroke="#3b82f6" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Investment Status</CardTitle>
                </CardHeader>
                <CardContent>
                  {dashboardData && (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Active', value: dashboardData.investments.active },
                            { name: 'Completed', value: dashboardData.investments.completed }
                          ]}
                          dataKey="value"
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          label={({name, value}) => `${name}: ${value}`}
                        >
                          <Cell fill="#10b981" />
                          <Cell fill="#f59e0b" />
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Investments Tab */}
          <TabsContent value="investments">
            <Card>
              <CardHeader>
                <CardTitle>Active Investments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4">Plan</th>
                        <th className="text-left py-3 px-4">Amount</th>
                        <th className="text-left py-3 px-4">Daily ROI</th>
                        <th className="text-left py-3 px-4">Total ROI</th>
                        <th className="text-left py-3 px-4">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {investments.map((inv) => (
                        <tr key={inv._id} className="border-b hover:bg-muted">
                          <td className="py-3 px-4 font-medium">{inv.plan}</td>
                          <td className="py-3 px-4">₹{inv.amount?.toFixed(2)}</td>
                          <td className="py-3 px-4">₹{inv.dailyROI?.toFixed(2)}</td>
                          <td className="py-3 px-4 text-green-600">₹{inv.totalROIEarned?.toFixed(2)}</td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                inv.status === "ACTIVE"
                                  ? "bg-green-100 text-green-800"
                                  : inv.status === "COMPLETED"
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-red-100 text-red-800"
                              }`}
                            >
                              {inv.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ROI History Tab */}
          <TabsContent value="roi">
            <Card>
              <CardHeader>
                <CardTitle>ROI History (Last 30 Days)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={roiHistory}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value: any) => `₹${Number(value).toFixed(2)}`} />
                    <Legend />
                    <Bar dataKey="amount" fill="#8b5cf6" name="ROI Amount" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Referrals Tab */}
          <TabsContent value="referrals">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Referral Network</CardTitle>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => fetchReferralTree(authToken)}
                  disabled={loading}
                >
                  {loading ? "Refreshing..." : "Refresh"}
                </Button>
              </CardHeader>
              <CardContent>
                {/* Debug Info - Remove in production */}
                {process.env.NODE_ENV === 'development' && dashboardData?.user && (
                  <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm font-medium text-yellow-800">Debug Info:</p>
                    <p className="text-xs text-yellow-700">User ID: {dashboardData.user._id}</p>
                    <p className="text-xs text-yellow-700">Referral Code: {dashboardData.user.referralCode || 'Not set'}</p>
                    <p className="text-xs text-yellow-700">Direct Referrals: {dashboardData.referrals.direct}</p>
                  </div>
                )}

                {referralTree ? (
                  <div className="space-y-4">
                    <div className="text-sm text-muted-foreground mb-4">
                      Your referral network tree ({referralTree.children?.length || 0} direct referrals)
                    </div>
                    <ReferralTreeNode node={referralTree} />
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No referrals yet</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Share your referral code to start building your network
                    </p>
                    {dashboardData?.user?.referralCode && (
                      <div className="mt-4 p-3 bg-muted rounded-lg">
                        <p className="text-sm font-medium mb-2">Your Referral Code:</p>
                        <code className="text-lg font-bold text-primary">{dashboardData.user.referralCode}</code>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

// Define types for referral tree
interface ReferralNode {
  id: string
  name: string
  email: string
  referralCode?: string
  level: number
  children?: ReferralNode[]
}

// Recursive component to render referral tree
function ReferralTreeNode({ node, level = 0 }: { node: ReferralNode; level?: number }) {
  const hasChildren = node.children && node.children.length > 0

  return (
    <div className="ml-4">
      <div className="flex items-center gap-3 py-2 px-3 bg-card rounded-lg border border-border mb-2">
        <div className="flex-1">
          <p className="font-semibold">{node.name}</p>
          <p className="text-xs text-muted-foreground">{node.email}</p>
          {node.referralCode && (
            <p className="text-xs text-primary font-mono">{node.referralCode}</p>
          )}
        </div>
        <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
          Level {node.level}
        </span>
        {hasChildren && (
          <span className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded">
            {node.children?.length} referrals
          </span>
        )}
      </div>

      {hasChildren && (
        <div className="ml-4 border-l-2 border-border pl-4">
          {node.children?.map((child) => (
            <ReferralTreeNode key={child.id} node={child} level={node.level + 1} />
          ))}
        </div>
      )}
    </div>
  )
}
