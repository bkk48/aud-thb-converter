import OrderForm from "./OrderForm";

export default function OrderPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
      style={{ background: "radial-gradient(ellipse at 50% 0%, #1f1c14 0%, #0f0e0c 70%)" }}>
      <div className="w-full max-w-md">
        <OrderForm rate={22.5} feePercent={1} />
      </div>
    </div>
  );
}