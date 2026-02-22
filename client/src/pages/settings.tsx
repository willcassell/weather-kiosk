import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, Settings, Save, ShieldAlert } from "lucide-react";
import { Link } from "wouter";

export default function SettingsPage() {
    const { toast } = useToast();
    const [password, setPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [formData, setFormData] = useState<Record<string, any>>({});

    const { data, isLoading } = useQuery<any>({
        queryKey: ['/api/config'],
    });

    useEffect(() => {
        if (data?.config) {
            setFormData(data.config);
        }
    }, [data]);

    const mutation = useMutation({
        mutationFn: async (payload: any) => {
            const response = await fetch('/api/config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Failed to save configuration');
            }
            return response.json();
        },
        onSuccess: () => {
            toast({ title: 'Success', description: 'Configuration saved successfully. Return to dashboard to see changes.' });
            queryClient.invalidateQueries({ queryKey: ['/api/config'] });
            setNewPassword("");
        },
        onError: (error: Error) => {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        }
    });

    const handleChange = (key: string, value: any) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    };

    const handleSave = () => {
        mutation.mutate({
            ...formData,
            password: password || undefined,
            newPassword: newPassword || undefined
        });
    };

    if (isLoading) {
        return <div className="flex h-screen items-center justify-center bg-background"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;
    }

    const { config, secrets } = data || {};
    const requiresPassword = config?.hasPassword;

    return (
        <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/">
                            <Button variant="outline" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold flex items-center gap-2"><Settings className="h-8 w-8 text-primary" /> System Settings</h1>
                            <p className="text-muted-foreground">Configure display options, intervals, and data retention</p>
                        </div>
                    </div>
                    <Button onClick={handleSave} disabled={mutation.isPending} className="gap-2">
                        {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        Save Changes
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Display Settings */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Display Settings</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Station Display Name</Label>
                                <Input value={formData.displayName || ""} onChange={(e) => handleChange('displayName', e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Unit System</Label>
                                <Select value={formData.unitSystem} onValueChange={(v) => handleChange('unitSystem', v)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="imperial">Imperial (°F, mph, inHg)</SelectItem>
                                        <SelectItem value="metric">Metric (°C, km/h, hPa)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Timezone</Label>
                                <Select value={formData.timezone} onValueChange={(v) => handleChange('timezone', v)}>
                                    <SelectTrigger><SelectValue placeholder="Select a timezone" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="America/New_York">Eastern Time (ET - New York)</SelectItem>
                                        <SelectItem value="America/Chicago">Central Time (CT - Chicago)</SelectItem>
                                        <SelectItem value="America/Denver">Mountain Time (MT - Denver)</SelectItem>
                                        <SelectItem value="America/Phoenix">Mountain Time (Arizona - No DST)</SelectItem>
                                        <SelectItem value="America/Los_Angeles">Pacific Time (PT - Los Angeles)</SelectItem>
                                        <SelectItem value="America/Anchorage">Alaska Time (AKT - Anchorage)</SelectItem>
                                        <SelectItem value="America/Honolulu">Hawaii-Aleutian Time (HAT - Honolulu)</SelectItem>
                                        <SelectItem value="UTC">Coordinated Universal Time (UTC)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Refresh Intervals */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Refresh Intervals (Minutes)</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-4">
                                <div className="flex justify-between">
                                    <Label>Weather Data Refresh</Label>
                                    <span className="text-sm font-mono">{formData.weatherRefreshInterval || 3} min</span>
                                </div>
                                <Slider min={1} max={15} step={1} value={[parseInt(formData.weatherRefreshInterval) || 3]} onValueChange={([v]) => handleChange('weatherRefreshInterval', v.toString())} />
                            </div>
                            <div className="space-y-4">
                                <div className="flex justify-between">
                                    <Label>Thermostat Data Refresh</Label>
                                    <span className="text-sm font-mono">{formData.thermostatRefreshInterval || 3} min</span>
                                </div>
                                <Slider min={1} max={30} step={1} value={[parseInt(formData.thermostatRefreshInterval) || 3]} onValueChange={([v]) => handleChange('thermostatRefreshInterval', v.toString())} />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Radar Configuration */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Radar Configuration</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Center Latitude</Label>
                                    <Input type="number" step="0.001" value={formData.radarCenterLat || ""} onChange={(e) => handleChange('radarCenterLat', e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Center Longitude</Label>
                                    <Input type="number" step="0.001" value={formData.radarCenterLon || ""} onChange={(e) => handleChange('radarCenterLon', e.target.value)} />
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="flex justify-between">
                                    <Label>Zoom Level</Label>
                                    <span className="text-sm font-mono">{formData.radarZoomLevel || 7.25}</span>
                                </div>
                                <Slider min={4} max={12} step={0.25} value={[parseFloat(formData.radarZoomLevel) || 7.25]} onValueChange={([v]) => handleChange('radarZoomLevel', v.toString())} />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Security */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><ShieldAlert className="h-5 w-5 text-amber-500" /> Security & Access</CardTitle>
                            <CardDescription>Protect settings from unauthorized changes</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {requiresPassword && (
                                <div className="space-y-2">
                                    <Label>Current Password (Required to save)</Label>
                                    <Input type="password" placeholder="Enter current password" value={password} onChange={(e) => setPassword(e.target.value)} />
                                </div>
                            )}
                            <div className="space-y-2">
                                <Label>{requiresPassword ? "Set New Password (Optional)" : "Set Admin Password"}</Label>
                                <Input type="password" placeholder={requiresPassword ? "Leave blank to keep current" : "Enter password to protect settings"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                            </div>
                            <div className="mt-4 pt-4 border-t space-y-2">
                                <Label className="text-muted-foreground">Active Connections</Label>
                                <div className="text-sm space-y-1 font-mono text-muted-foreground">
                                    <div>WeatherFlow: {secrets?.weatherFlowTokenMasked || 'Not configured'}</div>
                                    <div>Beestat: {secrets?.beestatKeyMasked || 'Not configured'}</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
