export type LogSeverity = 'info' | 'warning' | 'error';

export interface ProjectLog {
  severity: LogSeverity;
  message: string;
  timestamp: number;
  context?: any;
}

/**
 * Centralized place to accumulate logs
 * during the conversion of a website.
 * This is a singleton and can be accessed
 * from anywhere within the project
 */
export default class JamifyLogger {
  private static projectLogs: ProjectLog[] = [];

  public static getLogs() {
    return this.projectLogs;
  }

  public static log(severity: LogSeverity, message: string) {
    console.log(`[JAMIFY LOGGER] (${severity}) ${message}`);
    this.projectLogs.push({
      severity,
      message,
      timestamp: Date.now(),
    });
  }

  /**
   * Clear all logs
   */
  public static flush() {
    this.projectLogs = [];
  }
}
