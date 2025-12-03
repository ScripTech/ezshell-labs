'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';
import { sendGAEvent } from '@next/third-parties/google';
import { useSession } from 'next-auth/react';

interface EnrollmentStatus {
  id: string | undefined;
  status: string | undefined;
  progress: number | undefined;
  enrolledAt: Date | undefined;
}

const EnrollmentStatus = ({labId, enrollment}: {labId: string, enrollment: EnrollmentStatus}) => {
  const { data: session } = useSession()

  const handleAccessLab = () => {
    if (enrollment.id) {
      sendGAEvent('lab_enrollment', 'access_lab', labId, "enrollmentId", enrollment.id);
      window.open(`/ezshell/${ labId }?enrollment=${ enrollment.id }`, '_blank')
    }
  }

  return (
    <div className='w-full'>
      <div className="flex flex-col mb-4">
        <div className="p-4 rounded-sm bg-blue-900/30 border border-blue-700/50">
          <h2 className="text-lg font-semibold mb-2">Welcome {session?.user?.name || 'Guest'}</h2>
          <p className="mb-4">
           🚀 Your lab is waiting for you. ID: <span className="font-semibold">{enrollment.id}</span>.
          </p>
          <Button onClick={handleAccessLab} className="flex-1">
            <ExternalLink className="w-4 h-4 mr-2" />
            Access Lab Environment
        </Button>
        </div>
      </div>
    </div>
  );
};


export default EnrollmentStatus;
