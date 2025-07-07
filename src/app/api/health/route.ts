import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Health check endpoint for monitoring
export async function GET(request: NextRequest) {
  const start = Date.now();
  
  try {
    // Check database connectivity
    await prisma.$queryRaw`SELECT 1`;
    
    const dbLatency = Date.now() - start;
    
    // Get basic system info
    const systemInfo = {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      nodeVersion: process.version,
      platform: process.platform,
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        external: Math.round(process.memoryUsage().external / 1024 / 1024),
      },
    };

    // Get database info
    const databaseInfo = {
      status: 'connected',
      latency: `${dbLatency}ms`,
      provider: 'cockroachdb',
    };

    // Check external services (if applicable)
    const servicesStatus = {
      appwrite: 'unknown', // Could add actual checks here
      resend: 'unknown',
    };

    const healthStatus = {
      status: 'healthy',
      timestamp: systemInfo.timestamp,
      system: systemInfo,
      database: databaseInfo,
      services: servicesStatus,
      checks: {
        database: dbLatency < 1000 ? 'pass' : 'warn',
        memory: systemInfo.memory.used < 500 ? 'pass' : 'warn',
      },
    };

    return NextResponse.json(healthStatus, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
    
  } catch (error) {
    console.error('Health check failed:', error);
    
    const errorStatus = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      checks: {
        database: 'fail',
      },
    };

    return NextResponse.json(errorStatus, { 
      status: 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  }
}
