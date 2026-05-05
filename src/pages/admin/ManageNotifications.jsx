import React from 'react';
import Card from '../../components/ui/Card';
import { Bell } from 'lucide-react';

const ManageNotifications = () => {
    return (
        <div className="p-4 md:p-6 max-w-2xl mx-auto">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <Bell className="text-brand-blue" />
                    Push Notifications
                </h1>
                <p className="text-slate-600 dark:text-slate-400 mt-1">
                    Manage and send direct device push notifications to students.
                </p>
            </div>

            <Card className="p-6">
                <div className="flex items-center gap-3 mb-4 text-brand-blue">
                    <Bell size={24} />
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">Device Push Notifications</h2>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                    Send notifications directly to student's mobile and desktop notification bars via Firebase Cloud Messaging (FCM).
                </p>
                
                <div className="bg-slate-50 dark:bg-[#111111] p-4 rounded-lg border border-slate-200 dark:border-white/5 space-y-3 text-sm text-slate-700 dark:text-slate-300">
                    <h3 className="font-semibold text-slate-800 dark:text-white">How to send:</h3>
                    <ol className="list-decimal pl-4 space-y-2">
                        <li>Go to your <a href="https://console.firebase.google.com/" target="_blank" rel="noreferrer" className="text-brand-blue hover:underline">Firebase Console</a></li>
                        <li>Select your project and navigate to <strong>Engage &gt; Messaging</strong>.</li>
                        <li>Click <strong>New Campaign</strong> and choose <strong>Notifications</strong>.</li>
                        <li>Write your title and message, and target the "Web" app.</li>
                        <li>Click <strong>Publish</strong>. All subscribed users will receive the push alert!</li>
                    </ol>
                </div>

                <div className="mt-6 p-4 border border-blue-100 dark:border-blue-500/20 bg-blue-50 dark:bg-blue-500/10 rounded-lg">
                    <p className="text-xs text-blue-800 dark:text-blue-300 text-center">
                        Note: Device Token collection is running in the background. Students will be prompted to allow notifications when they log in.
                    </p>
                </div>
            </Card>
        </div>
    );
};

export default ManageNotifications;
