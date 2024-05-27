module zkredpack::zkredpack {

    use sui::balance::Balance;
    use sui::coin;
    use sui::package;
    use sui::transfer::{public_transfer,  share_object};
    use sui::vec_set;
    use sui::vec_set::VecSet;
    use sui::dynamic_object_field as df;
    use sui::random;
    use sui::random::{Random, new_generator};

    // ======= ERRORS =======
    const E_Receiver_Exists: u64 = 1;
    const E_Receiver_Not_Exists: u64 = 2;
    const E_Already_Claimed: u64 = 3;

    public struct ZKREDPACK has drop {}

    public struct RedPackStore has key{
        id: UID,
    }

    public struct RedPack<phantom C> has key, store {
        id: UID,
        sender: address,
        receiver: address,
        claimers: VecSet<address>,
        quantity: u64,
        balance: Balance<C>
    }

    fun init(otw: ZKREDPACK, ctx: &mut TxContext) {
        let sender = tx_context::sender(ctx);
        let publisher = package::claim(otw, ctx);
        public_transfer(publisher, sender);

        share_object(RedPackStore{
            id: object::new(ctx),
        })
    }

    public fun new_redpack<C>(store: &mut RedPackStore, balance: Balance<C>, quantity: u64, receiver: address, ctx: &mut TxContext) {
        assert!(!df::exists_(&store.id, receiver), E_Receiver_Exists);

        let rp = RedPack{
            id: object::new(ctx),
            sender: ctx.sender(),
            receiver,
            quantity,
            claimers: vec_set::empty(),
            balance,
        };

        df::add(&mut store.id, receiver, rp);
    }

    entry fun claim<T>(store: &mut RedPackStore, random: &Random, receiver: address, ctx: &mut TxContext) {
        let sender = ctx.sender();
        assert!(df::exists_(&store.id, sender), E_Receiver_Not_Exists);

        let rp = df::borrow_mut<address, RedPack<T>>(&mut store.id, sender);

        assert!(!rp.claimers.contains(&receiver), E_Already_Claimed);

        let left = rp.quantity - rp.claimers.size();
        if (left != 1) {
            let left_amt = rp.balance.value();

            let mut rg = new_generator(random,ctx);
            let r_amt = random::generate_u64_in_range(&mut rg, 0, left_amt / left * 2);

            let claimed_c = rp.balance.split(r_amt);

            public_transfer(coin::from_balance(claimed_c, ctx), receiver);

            rp.claimers.insert(receiver)
        } else {
            let p = df::remove<address, RedPack<T>>(&mut store.id, sender);

            let RedPack {id, sender:_,receiver: _,claimers:_,quantity:_,balance,} = p;

            public_transfer(coin::from_balance(balance, ctx), receiver);

            object::delete(id);
        }
    }
}