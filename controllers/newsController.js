const News = require("../models/newsSchema");

// TODO: done // Test: Done!!
exports.createPost = async (req, res) => {
  try {
    const { title, content, category, audience, coverImage, status } = req.body;

    if (title?.trim() === "") {
      return res
        .status(400)
        .json({ success: false, message: "Title is required" });
    }

    if (!Array.isArray(audience) || audience.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Audience must be a non-empty array",
      });
    }

    const post = await News.create({
      tenantId: req.tenantId,
      createdBy: req.user.id,
      title,
      content,
      category,
      audience,
      coverImage,
      // Allow direct publish on create; otherwise default is DRAFT
      status: status === "PUBLISHED" ? "PUBLISHED" : "DRAFT",
      publishedAt: status === "PUBLISHED" ? new Date() : undefined,
    });

    const createdPost = await News.findById(post._id);
    if(!createdPost){
      return res.status(500).json({ success: false, message: "Failed to create post" });
    }
    res.status(201).json({ success: true, data: post });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// TODO: check  //Test: Done!!
exports.getAllPosts = async (req, res) => {
  try {
    const { status, search } = req.query;

    console.log("req.user:", req.user);
    const filter = { tenantId: req.tenantId };
    if (status) filter.status = status.toUpperCase();
    if (search) filter.title = { $regex: search, $options: "i" };

    const posts = await News.find(filter)
      .populate("createdBy", "name email")
      .sort({ isPinned: -1, createdAt: -1 });

    console.log("Posts fetched:", posts.length);

    res.json({ success: true, data: posts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// TODO: check //Test: Done!!
exports.getFeed = async (req, res) => {
  try {
    const role = req.user.role.toUpperCase();

    // query params
    let { page = 1, limit = 10 } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);

    // safety limits (avoid abuse)
    if (page < 1) page = 1;
    if (limit < 1 || limit > 50) limit = 10;

    const skip = (page - 1) * limit;

    const filter = {
      tenantId: req.tenantId,
      status: "PUBLISHED",
      audience: { $in: [role, "ALL"] },
    };


    const [posts, total] = await Promise.all([
      News.find(filter)
        .select("-content")
        .sort({ isPinned: -1, publishedAt: -1 })
        .skip(skip)
        .limit(limit),

      News.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: posts,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// TODO: done //Test: Done!!
exports.getPostById = async (req, res) => {
  try {
    const post = await News.findOne({
      _id: req.params.id,
      tenantId: req.tenantId,
      status: "PUBLISHED",
    }).populate("createdBy", "name");

    if (!post)
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });

    res.json({ success: true, data: post });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
// Test: needed
exports.updatePost = async (req, res) => {
  try {
    const { title, content, category, audience, coverImage } = req.body;

    const post = await News.findOneAndUpdate(
      // TODO: check
      { _id: req.params.id, tenantId: req.tenantId },
      { title, content, category, audience, coverImage },
      { new: true, runValidators: true },
    );

    if (!post)
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });

    res.json({ success: true, data: post });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// TODO: done Tes:Done!!
exports.publishPost = async (req, res) => {
  try {
    const post = await News.findOneAndUpdate(
      {
        _id: req.params.id,
        tenantId: req.tenantId,
        status: { $in: ["DRAFT", "ARCHIVED"] }, // only allow these → PUBLISHED
      },
      {
        status: "PUBLISHED",
        publishedAt: new Date(),
      },
      { new: true },
    );

    if (!post)
      return res.status(404).json({
        success: false,
        message: "Post not found or already published",
      });

    res.json({ success: true, data: post });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// TODO: done
exports.togglePin = async (req, res) => {
  try {
    const post = await News.findOne({
      _id: req.params.id,
      tenantId: req.tenantId,
    });

    if (!post)
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });

    post.isPinned = !post.isPinned;
    await post.save();

    res.json({ success: true, data: { isPinned: post.isPinned } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// TODO: done
exports.deletePost = async (req, res) => {
  try {
    const { mode } = req.query; // ?mode=archive

    if (mode === "archive") {
      const post = await News.findOneAndUpdate(
        { _id: req.params.id, tenantId: req.tenantId },
        { status: "ARCHIVED" },
        { new: true },
      );
      if (!post)
        return res
          .status(404)
          .json({ success: false, message: "Post not found" });
      return res.json({ success: true, data: post });
    }

    // delete permanently
    const post = await News.findOneAndDelete({
      _id: req.params.id,
      tenantId: req.tenantId,
    });
    if (!post)
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });

    res.json({ success: true, message: "Post deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
