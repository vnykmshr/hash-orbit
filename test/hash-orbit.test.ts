import { describe, test, expect, beforeEach } from 'vitest';
import { HashOrbit } from '../src/index.js';

describe('HashOrbit', () => {
  describe('constructor', () => {
    test('creates ring with default replicas (150)', () => {
      const ring = new HashOrbit();
      expect(ring.size).toBe(0);
      expect(ring.nodes).toEqual([]);
    });

    test('creates ring with custom replicas', () => {
      const ring = new HashOrbit({ replicas: 50 });
      expect(ring.size).toBe(0);
      expect(ring.nodes).toEqual([]);
    });
  });

  describe('add()', () => {
    let ring: HashOrbit;

    beforeEach(() => {
      ring = new HashOrbit({ replicas: 150 });
    });

    test('adds single node and increases size', () => {
      ring.add('server-1');
      expect(ring.size).toBe(1);
      expect(ring.nodes).toEqual(['server-1']);
    });

    test('adds multiple different nodes', () => {
      ring.add('server-1');
      ring.add('server-2');
      ring.add('server-3');

      expect(ring.size).toBe(3);
      expect(ring.nodes).toContain('server-1');
      expect(ring.nodes).toContain('server-2');
      expect(ring.nodes).toContain('server-3');
    });

    test('creates virtual nodes (replicas) for each physical node', () => {
      const smallRing = new HashOrbit({ replicas: 10 });
      smallRing.add('server-1');

      // toString should show 10 positions (virtual nodes)
      const info = smallRing.toString();
      expect(info).toContain('positions=10');
      expect(info).toContain('nodes=1');
    });

    test('adding same node twice is idempotent (same positions)', () => {
      const smallRing = new HashOrbit({ replicas: 10 });
      smallRing.add('server-1');
      const info1 = smallRing.toString();

      smallRing.add('server-1');
      const info2 = smallRing.toString();

      // Adding same node again should not change positions (deterministic hashing)
      expect(info1).toBe(info2);
      expect(info2).toContain('positions=10');
      expect(info2).toContain('nodes=1');
      expect(smallRing.size).toBe(1);
    });

    test('works with custom replicas configuration', () => {
      const ringWith50 = new HashOrbit({ replicas: 50 });
      ringWith50.add('server-1');

      const info = ringWith50.toString();
      expect(info).toContain('positions=50');
      expect(info).toContain('replicas=50');
    });

    test('nodes getter returns all unique nodes', () => {
      ring.add('server-1');
      ring.add('server-2');
      ring.add('server-3');

      const nodes = ring.nodes;
      expect(nodes).toHaveLength(3);
      expect(new Set(nodes).size).toBe(3); // All unique
    });
  });

  describe('remove()', () => {
    let ring: HashOrbit;

    beforeEach(() => {
      ring = new HashOrbit({ replicas: 150 });
      ring.add('server-1');
      ring.add('server-2');
      ring.add('server-3');
    });

    test('removes node and decreases size', () => {
      ring.remove('server-2');
      expect(ring.size).toBe(2);
      expect(ring.nodes).not.toContain('server-2');
    });

    test('removes all virtual nodes for physical node', () => {
      const smallRing = new HashOrbit({ replicas: 10 });
      smallRing.add('server-1');
      expect(smallRing.toString()).toContain('positions=10');

      smallRing.remove('server-1');
      expect(smallRing.toString()).toContain('positions=0');
      expect(smallRing.size).toBe(0);
    });

    test('removing non-existent node is safe (no-op)', () => {
      const sizeBefore = ring.size;
      ring.remove('non-existent');
      expect(ring.size).toBe(sizeBefore);
    });

    test('can remove and re-add same node', () => {
      ring.remove('server-1');
      expect(ring.size).toBe(2);

      ring.add('server-1');
      expect(ring.size).toBe(3);
      expect(ring.nodes).toContain('server-1');
    });

    test('removing all nodes results in empty ring', () => {
      ring.remove('server-1');
      ring.remove('server-2');
      ring.remove('server-3');

      expect(ring.size).toBe(0);
      expect(ring.nodes).toEqual([]);
    });
  });

  describe('get()', () => {
    let ring: HashOrbit;

    beforeEach(() => {
      ring = new HashOrbit({ replicas: 150 });
      ring.add('server-1');
      ring.add('server-2');
      ring.add('server-3');
    });

    test('returns a node for a given key', () => {
      const node = ring.get('user:123');
      expect(node).toBeDefined();
      expect(['server-1', 'server-2', 'server-3']).toContain(node);
    });

    test('returns same node for same key (deterministic)', () => {
      const node1 = ring.get('user:123');
      const node2 = ring.get('user:123');
      expect(node1).toBe(node2);
    });

    test('returns undefined for empty ring', () => {
      const emptyRing = new HashOrbit();
      expect(emptyRing.get('user:123')).toBeUndefined();
    });

    test('different keys may route to different nodes', () => {
      const nodes = new Set<string>();
      for (let i = 0; i < 100; i++) {
        const node = ring.get(`key:${i}`);
        if (node) nodes.add(node);
      }
      // With 100 keys and 3 servers, should hit multiple servers
      expect(nodes.size).toBeGreaterThan(1);
    });

    test('keys are distributed across all nodes', () => {
      const distribution = new Map<string, number>();
      for (let i = 0; i < 1000; i++) {
        const node = ring.get(`key:${i}`);
        if (node) {
          distribution.set(node, (distribution.get(node) || 0) + 1);
        }
      }

      // All nodes should receive some keys
      expect(distribution.size).toBe(3);
      expect(distribution.has('server-1')).toBe(true);
      expect(distribution.has('server-2')).toBe(true);
      expect(distribution.has('server-3')).toBe(true);
    });
  });

  describe('getN()', () => {
    let ring: HashOrbit;

    beforeEach(() => {
      ring = new HashOrbit({ replicas: 150 });
      ring.add('server-1');
      ring.add('server-2');
      ring.add('server-3');
    });

    test('returns N unique nodes for a key', () => {
      const nodes = ring.getN('user:123', 2);
      expect(nodes).toHaveLength(2);
      expect(new Set(nodes).size).toBe(2); // All unique
    });

    test('returns all nodes if count > available nodes', () => {
      const nodes = ring.getN('user:123', 10);
      expect(nodes.length).toBeLessThanOrEqual(3);
      expect(new Set(nodes).size).toBe(nodes.length); // All unique
    });

    test('returns empty array for empty ring', () => {
      const emptyRing = new HashOrbit();
      expect(emptyRing.getN('user:123', 2)).toEqual([]);
    });

    test('returns empty array for count <= 0', () => {
      expect(ring.getN('user:123', 0)).toEqual([]);
      expect(ring.getN('user:123', -1)).toEqual([]);
    });

    test('returns same nodes for same key (deterministic)', () => {
      const nodes1 = ring.getN('user:123', 2);
      const nodes2 = ring.getN('user:123', 2);
      expect(nodes1).toEqual(nodes2);
    });

    test('first node matches get() result', () => {
      const node = ring.get('user:123');
      const nodes = ring.getN('user:123', 3);
      expect(nodes[0]).toBe(node);
    });

    test('returns only unique physical nodes', () => {
      const nodes = ring.getN('user:123', 3);
      const uniqueNodes = new Set(nodes);
      expect(nodes.length).toBe(uniqueNodes.size);
    });
  });

  describe('edge cases', () => {
    test('empty ring has size 0', () => {
      const ring = new HashOrbit();
      expect(ring.size).toBe(0);
      expect(ring.nodes).toEqual([]);
    });

    test('single node ring', () => {
      const ring = new HashOrbit({ replicas: 10 });
      ring.add('server-1');

      expect(ring.size).toBe(1);
      expect(ring.get('any-key')).toBe('server-1');
      expect(ring.getN('any-key', 5)).toEqual(['server-1']);
    });

    test('ring with very few replicas', () => {
      const ring = new HashOrbit({ replicas: 1 });
      ring.add('server-1');
      ring.add('server-2');

      expect(ring.size).toBe(2);
      expect(ring.get('key')).toBeDefined();
    });

    test('toString() shows ring statistics', () => {
      const ring = new HashOrbit({ replicas: 50 });
      ring.add('server-1');
      ring.add('server-2');

      const info = ring.toString();
      expect(info).toContain('nodes=2');
      expect(info).toContain('positions=100');
      expect(info).toContain('replicas=50');
    });
  });

  describe('distribution tests', () => {
    test('removing a node redistributes ~1/n keys', () => {
      const ring = new HashOrbit({ replicas: 150 });
      ring.add('server-1');
      ring.add('server-2');
      ring.add('server-3');

      const keys = Array.from({ length: 1000 }, (_, i) => `key:${i}`);
      const beforeMap = new Map<string, string>();

      for (const key of keys) {
        const node = ring.get(key);
        if (node) beforeMap.set(key, node);
      }

      // Remove one server
      ring.remove('server-2');

      let redistributed = 0;
      for (const key of keys) {
        const node = ring.get(key);
        if (node !== beforeMap.get(key)) {
          redistributed++;
        }
      }

      // Should redistribute roughly 1/3 of keys (within reasonable margin)
      const expectedRedistribution = 1000 / 3;
      const margin = expectedRedistribution * 0.2; // 20% margin
      expect(redistributed).toBeGreaterThan(expectedRedistribution - margin);
      expect(redistributed).toBeLessThan(expectedRedistribution + margin);
    });

    test('keys are reasonably distributed across nodes', () => {
      const ring = new HashOrbit({ replicas: 150 });
      ring.add('server-1');
      ring.add('server-2');
      ring.add('server-3');

      const distribution = new Map<string, number>();
      for (let i = 0; i < 3000; i++) {
        const node = ring.get(`key:${i}`);
        if (node) {
          distribution.set(node, (distribution.get(node) || 0) + 1);
        }
      }

      // Each server should get roughly 1/3 of keys (within 20% margin)
      const expected = 1000;
      const margin = expected * 0.2;

      for (const count of distribution.values()) {
        expect(count).toBeGreaterThan(expected - margin);
        expect(count).toBeLessThan(expected + margin);
      }
    });
  });
});
