export const utangModule = {
    async charge() {
        throw new Error('utang.charge: not implemented in Phase 1');
    },
    async pay() {
        throw new Error('utang.pay: not implemented in Phase 1');
    },
    async balance() {
        return 0;
    }
};
