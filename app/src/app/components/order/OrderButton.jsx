// Button to order the pizzas
import PropTypes from "prop-types";
import {API_ENDPOINT} from "../../globals.js";
import {useRouter} from "next/navigation";

const OrderButton = ({order}) => {
	const router = useRouter()

	const pizzas = order.pizzas;
	const name = order.name;

	if (pizzas.length === 0) {
		return;
	}

	const body = {
		name: name,
		pizzas: pizzas
	}

	// Function to order the pizzas
	const orderPizza = () => {
		fetch('/api/order', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(body),
		})
			.then(response => response.json())
			.then(data => {
				if (data.orderId) {
					// console.log(`Order ID: ${data.orderId}`)

					// Add order ID to local storage
					const orderIds = JSON.parse(localStorage.getItem('orderIds')) || [];
					orderIds.push(data.orderId);
					localStorage.setItem('orderIds', JSON.stringify(orderIds));

					// Redirect to thank you page
					router.push(`/order/thank-you/${data.orderId}`)
				}
			})
	}

	return (
		<>
			<button onClick={() => orderPizza()} className="bg-primary-950 text-white px-4 py-2 rounded-lg mt-4 w-full md:w-auto hover:bg-primary-800">
				Order now
			</button>
		</>
	);
}

OrderButton.parameters = {
	order: {}
}

OrderButton.propTypes = {
	order: PropTypes.object
}

export default OrderButton;