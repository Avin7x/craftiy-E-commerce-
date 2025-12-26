import Order from "../models/order.model.js";
import Product from "../models/product.model.js";
import User from "../models/user.model.js";

export const getAnalytics = async (req, res) => {
  try {
    // Basic counts
    const totalUsers = await User.countDocuments();
    const totalProducts = await Product.countDocuments();

    // Overall sales & revenue
    const salesData = await Order.aggregate([
      {
        $group: {
          _id: null, // group all documents together
          totalSales: { $sum: 1 },
          totalRevenue: { $sum: "$totalAmount" }
        }
      }
    ]);

    const { totalSales, totalRevenue } =
      salesData[0] || { totalSales: 0, totalRevenue: 0 };

    const analyticsData = {
      totalUsers,
      totalProducts,
      totalSales,
      totalRevenue
    };

    // Date range (last 7 days)
    const endDate = new Date();
    const startDate = new Date(
      Date.now() - 7 * 24 * 60 * 60 * 1000
    );

    // 🔐 Safely fetch daily sales
    let dailySalesData = [];
    try {
      dailySalesData = await getDailySalesData(startDate, endDate);
    } catch (err) {
      console.warn("Daily sales unavailable, returning empty data", err.message);
      dailySalesData = [];
    }

    return res.status(200).json({
      analyticsData,
      dailySalesData
    });

  } catch (error) {
    console.error("Error in getAnalytics controller", error);
    return res.status(500).json({
      message: "Internal server error"
    });
  }
};

async function getDailySalesData(startDate, endDate) {
  try {
    const aggregatedData = await Order.aggregate([
      {
        $match: {
          createdAt: {
            $gte: startDate,
            $lte: endDate
          }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$createdAt"
            }
          },
          sales: { $sum: 1 },
          revenue: { $sum: "$totalAmount" }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Convert aggregation result to map for O(1) lookup
    const salesMap = new Map(
      aggregatedData.map(item => [item._id, item])
    );

    const dateArray = getDatesInRange(startDate, endDate);

    return dateArray.map(date => {
      const data = salesMap.get(date);
      return {
        date,
        sales: data ? data.sales : 0,
        revenue: data ? data.revenue : 0
      };
    });

  } catch (error) {
    console.error("Error in daily sales aggregation", error);
    throw error; // propagate to controller
  }
}

function getDatesInRange(startDate, endDate) {
  const dates = [];
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    dates.push(currentDate.toISOString().split("T")[0]);
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return dates;
}
