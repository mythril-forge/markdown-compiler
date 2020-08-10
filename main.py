from obtain_data import collect_data
from arrange_data import arrange_class_features
from arrange_data import compose_class_progressions
from write_feature_descriptions import generate_descriptions
from write_class_summaries import generate_summaries


def main():
	# Obtain all features, ever.
	all_classes, all_features = collect_data()

	# Ensure every feature has a description for every class.
	generate_descriptions(all_features)

	# Categorized class features.
	class_features = arrange_class_features(all_features)

	# Create a useful progression table index for classes.
	class_progressions = compose_class_progressions(class_features)

	# Create a summary for all the classes.
	class_summaries = generate_summaries(class_features, class_progressions, all_classes)

if __name__ == '__main__':
	main()
