export class MinHeap {
    constructor(balances) {
        // only neg bals
        this.heap = balances.filter(person => person.bal < 0);

        this.buildHeap();
    }

    buildHeap() {
        for (
            let i = Math.floor(this.heap.length / 2) - 1;
            i >= 0;
            i--
        ) {
            this.heapify(i);
        }
    }

    heapify(i) {
        let n = this.heap.length;

        while (true) {
            let smallest = i;

            let left = 2 * i + 1;
            let right = 2 * i + 2;

            if (
                left < n &&
                this.heap[left].bal < this.heap[smallest].bal
            ) {
                smallest = left;
            }

            if (
                right < n &&
                this.heap[right].bal < this.heap[smallest].bal
            ) {
                smallest = right;
            }

            if (smallest === i) {
                break;
            }

            [this.heap[i], this.heap[smallest]] =
                [this.heap[smallest], this.heap[i]];

            i = smallest;
        }
    }

    top() {
        if (this.heap.length === 0) {
            return null;
        }

        return this.heap[0];
    }

    pop() {
        if (this.heap.length === 0) {
            return null;
        }

        if (this.heap.length === 1) {
            return this.heap.pop();
        }

        let root = this.heap[0];

        this.heap[0] = this.heap.pop();

        this.heapify(0);

        return root;
    }

    push(person) {
        this.heap.push(person);

        let i = this.heap.length - 1;

        while (i > 0) {
            let parent = Math.floor((i - 1) / 2);

            if (this.heap[parent].bal <= this.heap[i].bal) {
                break;
            }

            [this.heap[parent], this.heap[i]] =
                [this.heap[i], this.heap[parent]];

            i = parent;
        }
    }

    size() {
        return this.heap.length;
    }
}


export class MaxHeap {
    constructor(balances) {
        // Only creditors (positive balances)
        this.heap = balances.filter(person => person.bal > 0);

        this.buildHeap();
    }

    buildHeap() {
        for (
            let i = Math.floor(this.heap.length / 2) - 1;
            i >= 0;
            i--
        ) {
            this.heapify(i);
        }
    }

    heapify(i) {
        let n = this.heap.length;

        while (true) {
            let largest = i;

            let left = 2 * i + 1;
            let right = 2 * i + 2;

            if (
                left < n &&
                this.heap[left].bal > this.heap[largest].bal
            ) {
                largest = left;
            }

            if (
                right < n &&
                this.heap[right].bal > this.heap[largest].bal
            ) {
                largest = right;
            }

            if (largest === i) {
                break;
            }

            [this.heap[i], this.heap[largest]] =
                [this.heap[largest], this.heap[i]];

            i = largest;
        }
    }

    top() {
        if (this.heap.length === 0) {
            return null;
        }

        return this.heap[0];
    }

    pop() {
        if (this.heap.length === 0) {
            return null;
        }

        if (this.heap.length === 1) {
            return this.heap.pop();
        }

        let root = this.heap[0];

        this.heap[0] = this.heap.pop();

        this.heapify(0);

        return root;
    }

    push(person) {
        this.heap.push(person);

        let i = this.heap.length - 1;

        while (i > 0) {
            let parent = Math.floor((i - 1) / 2);

            if (this.heap[parent].bal >= this.heap[i].bal) {
                break;
            }

            [this.heap[parent], this.heap[i]] =
                [this.heap[i], this.heap[parent]];

            i = parent;
        }
    }

    size() {
        return this.heap.length;
    }
}