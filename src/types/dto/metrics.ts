import {PoolStats} from "./poolStats";

export interface Metrics {
    db: PoolStats;
    connections: number;
}