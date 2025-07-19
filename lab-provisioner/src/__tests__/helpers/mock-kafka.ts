export class MockKafkaProducer {
  private sentMessages: Array<{ topic: string; message: any }> = [];
  private shouldFail = false;

  async enrollLab(userId: string, labId: string, enrollmentId: string): Promise<void> {
    if (this.shouldFail) {
      throw new Error('Mock Kafka failure');
    }

    this.sentMessages.push({
      topic: 'lab-enrollment',
      message: {
        type: 'enrollment-created',
        userId,
        labId,
        enrollmentId,
        timestamp: new Date().toISOString(),
      },
    });
  }

  async sendMessage(topic: string, message: any): Promise<void> {
    if (this.shouldFail) {
      throw new Error('Mock Kafka failure');
    }

    this.sentMessages.push({ topic, message });
  }

  getSentMessages(): Array<{ topic: string; message: any }> {
    return [...this.sentMessages];
  }

  getLastMessage(): { topic: string; message: any } | undefined {
    return this.sentMessages[this.sentMessages.length - 1];
  }

  getMessagesByTopic(topic: string): Array<{ topic: string; message: any }> {
    return this.sentMessages.filter(msg => msg.topic === topic);
  }

  setShouldFail(shouldFail: boolean): void {
    this.shouldFail = shouldFail;
  }

  reset(): void {
    this.sentMessages = [];
    this.shouldFail = false;
  }

  getMessageCount(): number {
    return this.sentMessages.length;
  }
}
