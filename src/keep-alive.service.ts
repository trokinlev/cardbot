import {
  Injectable,
  Logger,
  OnApplicationShutdown,
  OnModuleInit,
} from '@nestjs/common';

const DEFAULT_INTERVAL_MS = 10 * 60 * 1000;
const HEALTH_PATH = '/health';
const REQUEST_TIMEOUT_MS = 10_000;

@Injectable()
export class KeepAliveService implements OnModuleInit, OnApplicationShutdown {
  private readonly logger = new Logger(KeepAliveService.name);
  private timer?: NodeJS.Timeout;

  onModuleInit(): void {
    const url = this.resolveUrl();

    if (!url) {
      this.logger.log(
        'Keep-alive disabled: KEEP_ALIVE_URL / RENDER_EXTERNAL_URL is not set',
      );
      return;
    }

    const intervalMs =
      Number(process.env.KEEP_ALIVE_INTERVAL_MS) || DEFAULT_INTERVAL_MS;

    this.timer = setInterval(() => void this.ping(url), intervalMs);
    this.timer.unref();
    this.logger.log(`Keep-alive enabled: GET ${url} every ${intervalMs}ms`);

    void this.ping(url);
  }

  onApplicationShutdown(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
  }

  private resolveUrl(): string | null {
    const explicit = process.env.KEEP_ALIVE_URL?.trim();
    if (explicit) {
      return explicit;
    }

    const external = process.env.RENDER_EXTERNAL_URL?.trim();
    if (external) {
      return `${external.replace(/\/+$/, '')}${HEALTH_PATH}`;
    }

    return null;
  }

  private async ping(url: string): Promise<void> {
    try {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
      this.logger.debug(`Keep-alive ${url} -> ${response.status}`);
    } catch (error) {
      this.logger.warn(
        `Keep-alive ${url} failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
