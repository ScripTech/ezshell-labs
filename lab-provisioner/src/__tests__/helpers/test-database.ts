import { v4 as uuidv4 } from 'uuid';

interface MockEnrollment {
  id: string;
  userId: string;
  labId: string;
  status: string;
  progress: number;
  enrolledAt: string;
  completedAt?: string;
}

interface MockQueueEntry {
  id: string;
  enrollmentId: string;
  userId: string;
  labId: string;
  status: string;
  attempts: number;
  maxAttempts: number;
  lastError?: string;
  createdAt: string;
  updatedAt: string;
  processedAt?: string;
  messageData?: any;
}

interface MockProvision {
  id: string;
  enrollmentId: string;
  instanceId?: string;
  publicIp?: string;
  privateIp?: string;
  instanceState: string;
  keyPairName?: string;
  provisionedAt?: string;
  terminatedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export class TestDatabase {
  private enrollments: Map<string, MockEnrollment> = new Map();
  private queueEntries: Map<string, MockQueueEntry> = new Map();
  private provisions: Map<string, MockProvision> = new Map();

  async setup(): Promise<void> {
    // Initialize test database
    console.log('Setting up test database...');
  }

  async cleanup(): Promise<void> {
    // Cleanup test database
    this.clearTables();
    console.log('Test database cleaned up');
  }

  async clearTables(): Promise<void> {
    this.enrollments.clear();
    this.queueEntries.clear();
    this.provisions.clear();
  }

  getConnection() {
    // Return a mock database connection that simulates drizzle ORM operations
    return {
      select: () => ({
        from: (table: any) => ({
          where: (condition: any) => ({
            limit: (count: number) => {
              // Mock select operations based on table
              if (table === 'labEnrollments') {
                return Promise.resolve(Array.from(this.enrollments.values()));
              } else if (table === 'provisioningQueue') {
                return Promise.resolve(Array.from(this.queueEntries.values()));
              } else if (table === 'labProvisions') {
                return Promise.resolve(Array.from(this.provisions.values()));
              }
              return Promise.resolve([]);
            },
            orderBy: (column: any) => ({
              limit: (count: number) => ({
                offset: (offset: number) => Promise.resolve(Array.from(this.enrollments.values()).slice(offset, offset + count))
              })
            })
          }),
          leftJoin: (table: any, condition: any) => ({
            leftJoin: (table2: any, condition2: any) => ({
              limit: (count: number) => ({
                offset: (offset: number) => ({
                  orderBy: (column: any) => {
                    // Mock joined query results
                    const results = Array.from(this.enrollments.values()).map(enrollment => {
                      const queueEntry = Array.from(this.queueEntries.values()).find(q => q.enrollmentId === enrollment.id);
                      const provision = Array.from(this.provisions.values()).find(p => p.enrollmentId === enrollment.id);

                      return {
                        enrollmentId: enrollment.id,
                        userId: enrollment.userId,
                        labId: enrollment.labId,
                        status: enrollment.status,
                        progress: enrollment.progress,
                        enrolledAt: enrollment.enrolledAt,
                        completedAt: enrollment.completedAt,
                        provisioningStatus: queueEntry?.status,
                        instanceId: provision?.instanceId,
                        instanceState: provision?.instanceState,
                        publicIp: provision?.publicIp,
                      };
                    });

                    return Promise.resolve(results.slice(offset, offset + count));
                  }
                })
              })
            })
          })
        })
      }),

      insert: (table: any) => ({
        values: (data: any) => {
          // Mock insert operations
          if (table === 'labEnrollments') {
            this.enrollments.set(data.id, {
              ...data,
              enrolledAt: data.enrolledAt || new Date().toISOString(),
            });
          } else if (table === 'provisioningQueue') {
            this.queueEntries.set(data.id, {
              ...data,
              createdAt: data.createdAt || new Date().toISOString(),
              updatedAt: data.updatedAt || new Date().toISOString(),
            });
          } else if (table === 'labProvisions') {
            this.provisions.set(data.id, {
              ...data,
              createdAt: data.createdAt || new Date().toISOString(),
              updatedAt: data.updatedAt || new Date().toISOString(),
            });
          }
          return Promise.resolve();
        }
      }),

      update: (table: any) => ({
        set: (data: any) => ({
          where: (condition: any) => {
            // Mock update operations
            if (table === 'provisioningQueue') {
              for (const [id, entry] of this.queueEntries) {
                // Simple mock condition matching
                if (condition.toString().includes(entry.enrollmentId)) {
                  this.queueEntries.set(id, { ...entry, ...data, updatedAt: new Date().toISOString() });
                  break;
                }
              }
            }
            return Promise.resolve();
          }
        })
      }),

      transaction: async (callback: (tx: any) => Promise<void>) => {
        // Mock transaction - just execute the callback with the same mock db
        await callback(this.getConnection());
      }
    };
  }

  async getEnrollment(enrollmentId: string): Promise<MockEnrollment | undefined> {
    return this.enrollments.get(enrollmentId);
  }

  async getQueueEntry(enrollmentId: string): Promise<MockQueueEntry | undefined> {
    return Array.from(this.queueEntries.values()).find(entry => entry.enrollmentId === enrollmentId);
  }

  async getAllEnrollments(): Promise<MockEnrollment[]> {
    return Array.from(this.enrollments.values());
  }

  async createProvision(data: {
    enrollmentId: string;
    instanceId?: string;
    publicIp?: string;
    privateIp?: string;
    instanceState: string;
    keyPairName?: string;
  }): Promise<void> {
    const provision: MockProvision = {
      id: uuidv4(),
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.provisions.set(provision.id, provision);
  }

  async updateQueueStatus(enrollmentId: string, status: string): Promise<void> {
    for (const [id, entry] of this.queueEntries) {
      if (entry.enrollmentId === enrollmentId) {
        this.queueEntries.set(id, {
          ...entry,
          status,
          updatedAt: new Date().toISOString(),
          processedAt: status === 'completed' ? new Date().toISOString() : entry.processedAt,
        });
        break;
      }
    }
  }
}
